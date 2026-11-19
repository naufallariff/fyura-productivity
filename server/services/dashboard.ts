// server/services/dashboard.ts
import "server-only";
import { withUser } from "@/server/db/tx";
import {
  requiredMissesByTitle,
  sumDeepFocusMinutes,
  sumReading,
} from "@/server/db/repositories/dashboard";
import { averageRatio, deltaPoints } from "@/domain/dashboard/compute";
import { weeklyChecklistRatio } from "@/domain/scoring/checklist";
import { computeTrend } from "@/domain/scoring/ewma";
import { calibrationState } from "@/domain/scoring/warmup";
import { addDays } from "@/domain/time/logical-date";
import { localIsoDate } from "@/domain/time/local-date";
import { weekOf } from "@/domain/time/week";
import { careerSummary } from "./career";
import { getChecklistScores } from "./checklist";
import { getLearningStreak } from "./journal";
import { getUserTimeZone } from "./user";

/**
 * Everything the dashboard shows. Private data is never read here, so nothing from
 * the private space can reach this response.
 */
export async function getDashboard(userId: string) {
  const timeZone = await getUserTimeZone(userId);
  const today = localIsoDate(new Date(), timeZone);

  const week = weekOf(today);
  const weekStart = week[0] ?? today;
  const weekEnd = week[6] ?? today;

  const previousWeek = weekOf(addDays(today, -7));
  const previousStart = previousWeek[0] ?? today;
  const previousEnd = previousWeek[6] ?? today;

  // 30 days covers the trend, the current week, and the previous week.
  const trendFrom = addDays(today, -29);

  const [scores, streak, career, output, misses] = await Promise.all([
    getChecklistScores(userId, trendFrom, today),
    getLearningStreak(userId, today, timeZone),
    careerSummary(userId, timeZone),
    withUser(userId, async (tx) => ({
      deepMinutes: await sumDeepFocusMinutes(tx, userId, weekStart, today),
      reading: await sumReading(tx, userId, weekStart, today),
    })),
    withUser(userId, (tx) => requiredMissesByTitle(tx, userId, addDays(today, -6), today)),
  ]);

  const weekScores = scores.filter((score) => score.date >= weekStart && score.date <= weekEnd);
  const previousScores = scores.filter(
    (score) => score.date >= previousStart && score.date <= previousEnd,
  );

  const weekRatio = weeklyChecklistRatio(weekScores);
  const previousRatio = weeklyChecklistRatio(previousScores);
  const calibration = calibrationState(scores);
  const trend = computeTrend(scores);
  const latest = trend.at(-1) ?? null;
  const previous = trend.at(-2) ?? null;
  const todayScore = scores.find((score) => score.date === today) ?? null;

  return {
    today,
    timeZone,
    calibration,
    week: {
      ratio: weekRatio,
      previousRatio,
      deltaPoints: calibration.isCalibrated ? deltaPoints(weekRatio, previousRatio) : null,
      recordedDays: weekScores.filter((score) => score.planned > 0).length,
      flexibleDays: weekScores.filter(
        (score) => score.status === "FLEXIBLE" || score.status === "OFF",
      ).length,
    },
    trend: {
      points: trend.map((point) => ({ date: point.date, ewma: point.ewma })),
      latest: latest?.ewma ?? null,
      deltaPrevious: calibration.isCalibrated
        ? deltaPoints(latest?.ewma ?? null, previous?.ewma ?? null)
        : null,
      average7: averageRatio(scores.slice(-7)),
    },
    todayChecklist: todayScore
      ? { planned: todayScore.planned, completed: todayScore.completed, ratio: todayScore.ratio }
      : null,
    output: {
      deepMinutes: output.deepMinutes,
      readingUnits: output.reading.units,
      readingMinutes: output.reading.minutes,
    },
    misses,
    career,
    learning: streak,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
