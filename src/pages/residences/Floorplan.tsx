import type { PlanKind } from "./data";

export function Floorplan({ kind, accent }: { kind: PlanKind; accent: string }) {
  const rooms: [string, number, number, number, number][] =
    kind === "penthouse"
      ? [
          ["Terrace", 8, 8, 184, 48],
          ["Great room", 8, 60, 120, 72],
          ["Kitchen", 132, 60, 60, 44],
          ["Suite", 8, 136, 70, 56],
          ["BR 2", 82, 136, 50, 56],
          ["BR 3", 136, 108, 56, 40],
          ["Pool", 136, 152, 56, 40],
        ]
      : kind === "corner3"
        ? [
            ["Living", 8, 8, 108, 70],
            ["Kitchen", 120, 8, 72, 42],
            ["Terrace", 120, 54, 72, 24],
            ["Primary", 8, 84, 78, 56],
            ["BR 2", 90, 84, 48, 56],
            ["BR 3", 142, 84, 50, 56],
          ]
        : kind === "exec2"
          ? [
              ["Living", 8, 8, 120, 78],
              ["Kitchen", 132, 8, 60, 42],
              ["Balcony", 132, 54, 60, 32],
              ["Primary", 8, 92, 88, 56],
              ["BR 2", 100, 92, 92, 56],
            ]
          : kind === "garden2"
            ? [
                ["Patio", 8, 8, 184, 32],
                ["Living", 8, 44, 112, 64],
                ["Kitchen", 124, 44, 68, 64],
                ["Primary", 8, 114, 90, 50],
                ["BR 2", 102, 114, 90, 50],
              ]
            : [
                ["Studio", 8, 8, 184, 100],
                ["Bath", 8, 114, 60, 50],
                ["Kitchen", 72, 114, 120, 50],
              ];

  return (
    <svg className="rx-plan" viewBox="0 0 200 168" role="img" aria-label={`${kind} floorplan schematic`}>
      <rect x="2" y="2" width="196" height="164" fill="none" stroke="currentColor" strokeOpacity="0.18" />
      {rooms.map(([label, x, y, w, h]) => (
        <g key={String(label)}>
          <rect
            x={x}
            y={y}
            width={w}
            height={h}
            fill={String(label).match(/Terrace|Balcony|Patio|Pool/) ? accent : "transparent"}
            fillOpacity={String(label).match(/Terrace|Balcony|Patio|Pool/) ? 0.18 : 0}
            stroke="currentColor"
            strokeOpacity="0.55"
          />
          <text x={Number(x) + 6} y={Number(y) + 14} fill="currentColor">
            {label}
          </text>
        </g>
      ))}
    </svg>
  );
}
