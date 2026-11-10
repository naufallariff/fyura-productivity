/** Default habits seeded for each new user. Keys are stable and never renamed. */
export const DEFAULT_HABITS = [
  {
    key: "prayer_five_daily",
    name: "Five daily prayers",
    category: "WORSHIP",
    kind: "BINARY",
    target: 1,
    offDayCore: true,
  },
  {
    key: "learning_daily",
    name: "Learning (reading or research)",
    category: "LEARNING",
    kind: "BINARY",
    target: 1,
    offDayCore: true,
  },
  {
    key: "deep_work",
    name: "Deep work (minutes)",
    category: "WORK",
    kind: "QUANTITY",
    target: 150,
    offDayCore: false,
  },
  {
    key: "quran",
    name: "Quran and tadabur (minutes)",
    category: "WORSHIP",
    kind: "QUANTITY",
    target: 10,
    offDayCore: false,
  },
] as const;
