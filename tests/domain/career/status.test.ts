import { describe, expect, it } from "vitest";
import { asJobStatus, isJobStatus, needsFollowUp } from "@/domain/career/status";

describe("job status", () => {
  it("accepts known statuses and rejects unknown ones", () => {
    expect(isJobStatus("OFFER")).toBe(true);
    expect(isJobStatus("HIRED")).toBe(false);
    expect(() => asJobStatus("HIRED")).toThrow(RangeError);
  });
});

describe("needsFollowUp", () => {
  it("flags an open job after seven days without a status change", () => {
    expect(needsFollowUp("APPLIED", "2026-11-01", "2026-11-10")).toBe(true);
  });

  it("does not flag a recent change", () => {
    expect(needsFollowUp("APPLIED", "2026-11-08", "2026-11-10")).toBe(false);
  });

  it("never flags a closed job", () => {
    expect(needsFollowUp("REJECTED", "2026-11-01", "2026-11-10")).toBe(false);
    expect(needsFollowUp("GHOSTED", "2026-11-01", "2026-11-10")).toBe(false);
  });
});
