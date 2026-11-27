import { Clock3, ListChecks, Timer, Sunrise } from "lucide-react";
import { Panel } from "@/components/ui/workspace-controls";
import { categories, type DayMode, type TimeBlock } from "@/models/daily";
import { duration, occupiedMinutes } from "@/utils/daily";

export function DailyMetrics({
  blocks,
  done,
  required,
  focus,
  mode,
}: {
  blocks: TimeBlock[];
  done: number;
  required: number;
  focus: number;
  mode: DayMode;
}) {
  const metrics = [
    {
      title: "Logged time",
      value: duration(occupiedMinutes(blocks)),
      detail: `${blocks.length} blocks · Elapsed time`,
      Icon: Clock3,
      tone: "blue",
    },
    {
      title: "Required completion",
      value: required ? `${Math.round((done / required) * 100)}%` : "N/A",
      detail: required ? `${done} of ${required} required items` : "No required items",
      Icon: ListChecks,
      tone: "aqua",
    },
    {
      title: "Deep focus",
      value: duration(focus),
      detail: "Completed timer sessions",
      Icon: Timer,
      tone: "violet",
    },
    { title: "Day status", value: mode, detail: "Time blocking mode", Icon: Sunrise, tone: "pink" },
  ];
  return (
    <section className="metrics" aria-label="Daily metrics">
      {metrics.map(({ title, value, detail, Icon, tone }) => (
        <article key={title} className="metric" data-tone={tone}>
          <div className="metric-symbol">
            <Icon size={20} />
          </div>
          <h2>{title}</h2>
          <strong>{value}</strong>
          <small>{detail}</small>
        </article>
      ))}
    </section>
  );
}

export function AllocationPanel({ blocks }: { blocks: TimeBlock[] }) {
  const breakdown = categories
    .map((category) => ({
      category,
      minutes: occupiedMinutes(blocks.filter((block) => block.category === category)),
    }))
    .filter(({ minutes }) => minutes > 0);
  const total = breakdown.reduce((sum, { minutes }) => sum + minutes, 0);
  let angle = 0;
  const stops = breakdown.map(({ category, minutes }) => {
    const start = angle;
    angle += (minutes / total) * 360;
    return `var(--category-${category.toLowerCase()}) ${start}deg ${angle}deg`;
  });
  return (
    <Panel title="Time allocation">
      <div
        className="allocation-pie"
        style={{ background: total ? `conic-gradient(${stops.join(", ")})` : undefined }}
      >
        <div>
          <strong>{duration(occupiedMinutes(blocks))}</strong>
          <small>Elapsed</small>
        </div>
      </div>
      {breakdown.length ? (
        <ul className="allocation-key">
          {breakdown.map(({ category, minutes }) => (
            <li key={category}>
              <i data-category={category} />
              <span>{category}</span>
              <strong>{duration(minutes)}</strong>
            </li>
          ))}
        </ul>
      ) : (
        <p>No time logged.</p>
      )}
      {total > occupiedMinutes(blocks) && <small>Concurrent categories count separately.</small>}
    </Panel>
  );
}
