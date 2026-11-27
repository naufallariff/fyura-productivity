"use client";

import { useId } from "react";

// Exact curve exported from FigCraft Daily / Upper Neon core / 11836.
const EDGE = "M0 61.25C276 61.25 348 0 624 0C960 0 1200 175 1536 175";
const TONES = ["aqua", "violet", "pink"] as const;

function NeonEdge({ id, placement }: { id: string; placement: "upper" | "lower" }) {
  return (
    <svg
      className={`neon-edge neon-edge-${placement}`}
      viewBox="0 0 1536 280"
      fill="none"
      preserveAspectRatio="none"
    >
      <defs>
        {TONES.map((tone) => (
          <linearGradient
            key={tone}
            id={`${id}-${tone}`}
            x1="0"
            x2="1536"
            y1="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" stopColor={`var(--prism-${tone})`} stopOpacity="0" />
            <stop offset=".24" stopColor={`var(--prism-${tone})`} />
            <stop offset=".72" stopColor={`var(--prism-${tone})`} />
            <stop offset="1" stopColor={`var(--prism-${tone})`} stopOpacity="0" />
          </linearGradient>
        ))}
      </defs>
      {TONES.map((tone, index) => (
        <g
          key={tone}
          className="neon-filament"
          data-tone={tone}
          transform={`translate(0 ${index * 16 + 26})`}
          stroke={`url(#${id}-${tone})`}
        >
          <path className="neon-spill" d={EDGE} />
          <path className="neon-bloom" d={EDGE} />
          <path className="neon-core" d={EDGE} />
          <path className="neon-traveller" d={EDGE} pathLength="100" />
          <path className="neon-reflection" d={EDGE} transform="translate(0 5)" />
        </g>
      ))}
    </svg>
  );
}

export function WorkspaceBackground() {
  const id = useId().replace(/:/g, "");
  return (
    <div className="workspace-background" aria-hidden>
      <NeonEdge id={`${id}-upper`} placement="upper" />
      <NeonEdge id={`${id}-lower`} placement="lower" />
    </div>
  );
}
