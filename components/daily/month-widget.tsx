"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { IconButton, Panel } from "@/components/ui/workspace-controls";
import { previewDate } from "@/data/daily-fixture";
import { formatDate } from "@/utils/daily";

export function MonthWidget() {
  const [month, setMonth] = useState(previewDate.slice(0, 7));
  function shift(delta: number) {
    const date = new Date(month + "-01T00:00:00Z");
    date.setUTCMonth(date.getUTCMonth() + delta);
    setMonth(date.toISOString().slice(0, 7));
  }
  const date = new Date(month + "-01T00:00:00Z");
  const offset = (date.getUTCDay() + 6) % 7;
  const length = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  return (
    <Panel
      title={formatDate(month + "-01", { month: "long", year: "numeric" })}
      action={
        <div className="actions">
          <IconButton label="Previous month" onClick={() => shift(-1)}>
            <ChevronLeft size={16} />
          </IconButton>
          <IconButton label="Next month" onClick={() => shift(1)}>
            <ChevronRight size={16} />
          </IconButton>
        </div>
      }
    >
      <div className="month-grid">
        {["M", "T", "W", "T", "F", "S", "S"].map((day, index) => (
          <small key={index}>{day}</small>
        ))}
        {Array.from({ length: offset }, (_, index) => (
          <span key={`blank-${index}`} />
        ))}
        {Array.from({ length }, (_, index) => (
          <span
            key={index}
            className={
              month === previewDate.slice(0, 7) && index === Number(previewDate.slice(-2)) - 1
                ? "today"
                : ""
            }
          >
            {index + 1}
          </span>
        ))}
      </div>
    </Panel>
  );
}
