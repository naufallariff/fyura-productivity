import { describe, expect, it } from "vitest";
import { createSingleFlight } from "@/client/hooks/single-flight";

describe("createSingleFlight", () => {
  it("shares one promise between overlapping calls", async () => {
    let runs = 0;
    const save = createSingleFlight(async () => {
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 5));
      return runs;
    });

    const [first, second] = [save(), save()];
    expect(await first).toBe(1);
    expect(await second).toBe(1);
    expect(runs).toBe(1);
  });

  it("runs again after the previous task has finished", async () => {
    let runs = 0;
    const save = createSingleFlight(async () => {
      runs += 1;
      return runs;
    });

    await save();
    expect(await save()).toBe(2);
  });
});
