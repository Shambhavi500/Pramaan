import type { ReactNode } from "react";

/** Label (overline) + value; technical values render in mono and stay selectable. */
export function MetadataRow({ label, children, mono = false, title }: { label: string; children: ReactNode; mono?: boolean; title?: string }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-baseline gap-3 py-1.5">
      <dt className="overline">{label}</dt>
      <dd className={`min-w-0 break-words text-sm text-ink-800 ${mono ? "mono-meta !text-ink-800" : ""}`} title={title}>
        {children}
      </dd>
    </div>
  );
}

/** Middle-truncated technical string that keeps the full value reachable. */
export function Hash({ value, head = 8, tail = 6 }: { value: string; head?: number; tail?: number }) {
  const short = value.length > head + tail + 1 ? `${value.slice(0, head)}…${value.slice(-tail)}` : value;
  return (
    <span className="hash" title={value}>
      {short}
    </span>
  );
}
