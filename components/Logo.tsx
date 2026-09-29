const GRID = ["xxf.m", "xxxm.", "xxf.a", "xxxm.", "xxf.m"];
const OPACITY: Record<string, number> = { x: 1, f: 0.5, m: 0.25 };
const CELL = 64 / GRID.length;
const GAP = CELL * 0.16;

// Dissolve mark: a solid original column breaking into fading derivatives, one verified (accent) cell.
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" className={className} aria-hidden>
      {GRID.flatMap((row, y) =>
        [...row].map((k, x) =>
          k === "." ? null : (
            <rect
              key={`${x}-${y}`}
              x={x * CELL + GAP / 2}
              y={y * CELL + GAP / 2}
              width={CELL - GAP}
              height={CELL - GAP}
              rx={CELL * 0.16}
              fill={k === "a" ? "var(--color-lime, #b8f36b)" : "currentColor"}
              opacity={OPACITY[k]}
            />
          ),
        ),
      )}
    </svg>
  );
}
