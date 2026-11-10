import type { DayScore } from "./types";

export const CALIBRATION_DAYS = 7;

export interface CalibrationState {
  recordedDays: number;
  requiredDays: number;
  isCalibrated: boolean;
}

/** Counts recorded days. Averages and trend comparisons stay hidden until calibrated. */
export function calibrationState(scores: readonly DayScore[]): CalibrationState {
  const recordedDays = scores.filter((s) => s.ratio !== null).length;
  return {
    recordedDays,
    requiredDays: CALIBRATION_DAYS,
    isCalibrated: recordedDays >= CALIBRATION_DAYS,
  };
}
