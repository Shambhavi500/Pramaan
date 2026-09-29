export function Code({ title, children }: { title: string; children: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-navy/80">
      <div className="flex items-center gap-2 border-b border-line bg-white/[0.03] px-4 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-bad/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-good/70" />
        <span className="ml-2 truncate font-mono text-[11px] text-muted">{title}</span>
      </div>
      <pre className="overflow-x-auto p-4 font-mono text-[12px] leading-relaxed text-soft">{children.trim()}</pre>
    </div>
  );
}

export function Tags({ items, tone = "outline" }: { items: string[]; tone?: "outline" | "lime" | "cyan" }) {
  const cls = tone === "lime" ? "chip-lime" : tone === "cyan" ? "chip-cyan" : "chip-outline";
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((t) => (
        <span key={t} className={cls + " normal-case tracking-normal"}>
          {t}
        </span>
      ))}
    </div>
  );
}
