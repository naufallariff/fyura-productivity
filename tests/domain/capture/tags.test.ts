import { describe, expect, it } from "vitest";
import { MAX_TAGS_PER_IDEA, extractTags, normalizeTag, normalizeTags } from "@/domain/capture/tags";

describe("normalizeTag", () => {
  it("lowercases and strips one leading hash", () => {
    expect(normalizeTag("#Deep-Work")).toBe("deep-work");
  });

  it("rejects spaces, empty values, and leading hyphens", () => {
    expect(normalizeTag("deep work")).toBeNull();
    expect(normalizeTag("")).toBeNull();
    expect(normalizeTag("-x")).toBeNull();
  });
});

describe("normalizeTags", () => {
  it("removes duplicates after normalization", () => {
    expect(normalizeTags(["a", "A", "b"])).toEqual(["a", "b"]);
  });

  it("caps the number of tags", () => {
    const many = Array.from({ length: 12 }, (_, index) => `t${index}`);
    expect(normalizeTags(many)).toHaveLength(MAX_TAGS_PER_IDEA);
  });
});

describe("extractTags", () => {
  it("finds inline hashtags and normalizes them", () => {
    expect(extractTags("Belajar #AI dan #deep-work, #ai")).toEqual(["ai", "deep-work"]);
  });
});
