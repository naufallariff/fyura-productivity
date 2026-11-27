import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { IconButton, Panel } from "@/components/ui/workspace-controls";
import type { useFocusTimer } from "@/hooks/use-focus-timer";
import { clock } from "@/utils/daily";

export function FocusPanel({ timer }: { timer: ReturnType<typeof useFocusTimer> }) {
  return (
    <Panel title="Focus timer" className="focus-panel" action={<Timer size={20} />}>
      <div className="timer-face">
        <span>{clock(timer.seconds)}</span>
      </div>
      <form
        className="timer-settings"
        onSubmit={(event) => {
          event.preventDefault();
          timer.configure(Number(new FormData(event.currentTarget).get("minutes")));
        }}
      >
        <select
          aria-label="Focus preset"
          disabled={timer.running}
          value={[25, 50, 90].includes(timer.minutes) ? timer.minutes : "custom"}
          onChange={(event) => {
            if (event.target.value !== "custom") timer.configure(Number(event.target.value));
          }}
        >
          <option value="25">Short · 25m</option>
          <option value="50">Middle · 50m</option>
          <option value="90">Long · 90m</option>
          <option value="custom" disabled>
            Custom
          </option>
        </select>
        <input
          aria-label="Custom minutes"
          name="minutes"
          type="number"
          min="1"
          max="240"
          required
          placeholder="Min"
          disabled={timer.running}
        />
        <button disabled={timer.running}>Set</button>
      </form>
      <div className="timer-actions">
        <button className="primary" onClick={timer.toggle}>
          {timer.running ? <Pause size={16} /> : <Play size={16} />}
          {timer.running
            ? "Pause"
            : timer.seconds === timer.minutes * 60 || timer.seconds === 0
              ? "Start"
              : "Resume"}
        </button>
        <IconButton label="Reset timer" onClick={() => timer.configure(timer.minutes)}>
          <RotateCcw size={17} />
        </IconButton>
      </div>
    </Panel>
  );
}
