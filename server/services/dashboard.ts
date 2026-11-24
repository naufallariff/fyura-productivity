// server/services/dashboard.ts
import "server-only";
import { withUser } from "@/server/db/tx";
import {
  listRecordedDates,
  projectChecklistProgress,
  requiredMissesByTitle,
  sumDeepFocusMinutes,
  sumReading,
} from "@/server/db/repositories/dashboard";
import { listBoardsPage } from "@/server/db/repositories/projects";
import { averageRatio, deltaPoints } from "@/domain/dashboard/compute";
import { weeklyChecklistRatio } from "@/domain/scoring/checklist";
import { computeTrend } from "@/domain/scoring/ewma";
import { calibrationState } from "@/domain/scoring/warmup";
import { addDays } from "@/domain/time/logical-date";
import { weekOf } from "@/domain/time/week";
import { careerSummary } from "@/server/services/career";
import { getChecklist, getChecklistScores } from "@/server/services/checklist";
import { getLearningStreak } from "@/server/services/journal";
import { getUserDay } from "@/server/services/user";

/**
 * Everything the dashboard shows. Private data is never read here, so nothing from
 * the private space can reach this response.
 */
export async function getDashboard(userId: string) {
  const { today, timeZone } = await getUserDay(userId);

  const week = weekOf(today);
  const weekStart = week[0] ?? today;
  const weekEnd = week[6] ?? today;

  const previousWeek = weekOf(addDays(today, -7));
  const previousStart = previousWeek[0] ?? today;
  const previousEnd = previousWeek[6] ?? today;

  // 30 days covers the trend, the current week, and the previous week.
  const trendFrom = addDays(today, -29);

  const [scores, streak, career, checklist, activity, misses, projects] = await Promise.all([
    getChecklistScores(userId, trendFrom, today),
    getLearningStreak(userId, today, timeZone),
    careerSummary(userId, timeZone),
    getChecklist(userId, today),
    withUser(userId, async (tx) => {
      const [deepMinutes, reading, todayMinutes, recordedDates] = await Promise.all([
        sumDeepFocusMinutes(tx, userId, weekStart, today),
        sumReading(tx, userId, weekStart, today),
        sumDeepFocusMinutes(tx, userId, today, today),
        listRecordedDates(tx, userId),
      ]);
      return { deepMinutes, reading, todayMinutes, recordedDates };
    }),
    withUser(userId, (tx) => requiredMissesByTitle(tx, userId, addDays(today, -6), today)),
    withUser(userId, async (tx) => {
      const boards = await listBoardsPage(tx, userId, false, null, 4);
      const progress = await projectChecklistProgress(
        tx,
        userId,
        boards.map(({ id }) => id),
      );
      const byBoard = new Map(progress.map((item) => [item.boardId, item]));
      return boards.map(({ id, title }) => ({
        id,
        title,
        done: byBoard.get(id)?.done ?? 0,
        total: byBoard.get(id)?.total ?? 0,
      }));
    }),
  ]);

  const recorded = new Set(activity.recordedDates);
  const lastSevenStart = addDays(today, -6);
  const recordedScores = scores.filter(({ date }) => recorded.has(date));
  const weekScores = recordedScores.filter(
    (score) => score.date >= weekStart && score.date <= weekEnd,
  );
  const previousScores = recordedScores.filter(
    (score) => score.date >= previousStart && score.date <= previousEnd,
  );

  const weekRatio = weeklyChecklistRatio(weekScores);
  const previousRatio = weeklyChecklistRatio(previousScores);
  const calibration = calibrationState(recordedScores);
  const trend = computeTrend(recordedScores);
  const latest = trend.at(-1) ?? null;
  const previous = trend.at(-2) ?? null;
  const targetMinutes = checklist.items.reduce(
    (total, item) => total + (item.category === "WORK" ? (item.plannedMinutes ?? 0) : 0),
    0,
  );

  return {
    today,
    timeZone,
    recordedDates: activity.recordedDates,
    checklist,
    projects,
    focus: { completedMinutes: activity.todayMinutes, targetMinutes },
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
      average7: averageRatio(recordedScores.filter(({ date }) => date >= lastSevenStart)),
    },
    output: {
      deepMinutes: activity.deepMinutes,
      readingUnits: activity.reading.units,
      readingMinutes: activity.reading.minutes,
    },
    misses,
    career,
    learning: streak,
  };
}

export type DashboardData = Awaited<ReturnType<typeof getDashboard>>;
