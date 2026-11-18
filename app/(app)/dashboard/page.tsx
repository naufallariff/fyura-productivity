import { redirect } from "next/navigation";

/** Temporary redirect. The interactive dashboard is built in R9. */
export default function DashboardPage(): never {
  redirect("/daily-tracker");
}
