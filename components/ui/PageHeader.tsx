import type { ReactNode } from "react";

/** Editorial page title: overline (lifecycle stage) + display title + supporting line + optional aside. */
export function PageHeader({ stage, title, children, aside }: { stage: string; title: string; children?: ReactNode; aside?: ReactNode }) {
  return (
    <header className="enter mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl space-y-2">
        <p className="overline">{stage}</p>
        <h1 className="font-display text-4xl leading-[1.12] tracking-[-0.02em] text-ink-900">{title}</h1>
        {children && <div className="text-[15px] leading-relaxed text-ink-700">{children}</div>}
      </div>
      {aside}
    </header>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="surface-1 mx-auto max-w-md space-y-2 px-6 py-12 text-center">
      <h2 className="font-display text-2xl">{title}</h2>
      {children && <div className="text-sm text-ink-700">{children}</div>}
    </div>
  );
}
