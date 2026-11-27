export const dailyLabel = "Daily tracker";

export const navigation = [
  {
    label: "Productivity",
    items: [dailyLabel, "Weekly scheduler", "Project tracker", "Job tracker"],
  },
  { label: "Finance", items: ["Finance tracker", "Investments", "Goals and budgets"] },
  { label: "Personal notes", items: ["Notes", "Journal", "Learning", "Capturing idea", "Tadabur"] },
  { label: "Private room", items: ["Private habits", "Private journal"] },
  { label: "Google workspace", items: ["Email", "Calendar"] },
] as const;
