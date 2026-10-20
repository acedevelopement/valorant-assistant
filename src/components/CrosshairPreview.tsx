import { parseCrosshair } from "../lib/crosshairParser";

// Renders a crosshair as SVG. Approximate — not pixel-perfect, but
// visually close to what Valorant draws.
//
// The Valorant units are roughly: 1 unit = 1px at 1080p, but they
// don't map to screen pixels 1:1. We scale them by SCALE to fit
// a readable card preview.

const SIZE = 200; // SVG canvas size
const CENTER = SIZE / 2;
const SCALE = 2.2; // Valorant units -> SVG pixels

export default function CrosshairPreview({ code }: { code: string }) {
  const c = parseCrosshair(code);

  // Draw one line (rectangle) pointing up from the center.
  // Then rotate for the other three directions.
  const renderLine = (
    length: number,
    thickness: number,
    offset: number,
    opacity: number,
    key: string
  ) => {
    if (length <= 0 || thickness <= 0) return null;

    const w = thickness * SCALE;
    const h = length * SCALE;
    const yOffset = offset * SCALE;

    // Line sits offset pixels away from center, extends outward.
    const y = CENTER - yOffset - h;
    const x = CENTER - w / 2;

    const rect = (
      <rect
        key={key}
        x={x}
        y={y}
        width={w}
        height={h}
        fill={c.color}
        opacity={opacity}
      />
    );

    return (
      <g key={key}>
        {rect}
        <g transform={`rotate(90 ${CENTER} ${CENTER})`}>{rect}</g>
        <g transform={`rotate(180 ${CENTER} ${CENTER})`}>{rect}</g>
        <g transform={`rotate(270 ${CENTER} ${CENTER})`}>{rect}</g>
      </g>
    );
  };

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full h-full"
      style={{ background: "#000" }}
    >
      {/* Inner lines */}
      {renderLine(
        c.inner.length,
        c.inner.thickness,
        c.inner.offset,
        c.inner.opacity,
        "inner"
      )}

      {/* Outer lines */}
      {renderLine(
        c.outer.length,
        c.outer.thickness,
        c.outer.offset,
        c.outer.opacity,
        "outer"
      )}

      {/* Center dot */}
      {c.dot.enabled && c.dot.size > 0 && (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={(c.dot.size * SCALE) / 2}
          fill={c.color}
          opacity={c.dot.opacity}
        />
      )}
    </svg>
  );
}
