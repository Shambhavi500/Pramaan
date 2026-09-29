function Box({ x, y, w, h, title, lines, accent = false }: { x: number; y: number; w: number; h: number; title: string; lines: string[]; accent?: boolean }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={12} className={accent ? "fill-panel-2 stroke-line-bright" : "fill-panel stroke-line"} strokeWidth={1.2} />
      <text x={x + 16} y={y + 28} className="fill-white text-[15px] font-normal">
        {title}
      </text>
      {lines.map((l, i) => (
        <text key={l} x={x + 16} y={y + 52 + i * 19} className="fill-soft text-[12px]">
          {l}
        </text>
      ))}
    </g>
  );
}

function Arrow({ d, label, lx, ly }: { d: string; label: string; lx: number; ly: number }) {
  return (
    <g>
      <path d={d} fill="none" className="stroke-lime" strokeWidth={1.4} strokeDasharray="5 4" markerEnd="url(#arrow)" />
      <text x={lx} y={ly} textAnchor="middle" className="fill-lime text-[11px]">
        {label}
      </text>
    </g>
  );
}

export function Architecture() {
  return (
    <div className="panel overflow-x-auto p-4 sm:p-6">
      <svg viewBox="0 0 980 400" className="min-w-[760px]" role="img" aria-label="Architecture: field and desk uploads go to Cloudinary, whose webhook feeds the Next.js trust engine, which writes to Supabase; reviewers and Claude sit on top.">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10 z" className="fill-lime" />
          </marker>
        </defs>

        <Box x={10} y={40} w={190} h={92} title="Field capture" lines={["/capture · SHA-256, GPS", "activity + phase"]} />
        <Box x={10} y={160} w={190} h={92} title="Desk import" lines={["/import · upload widget", "Drive, Dropbox, URL"]} />
        <Box x={10} y={290} w={190} h={92} title="Reviewer" lines={["/review · V or R", "server action"]} />

        <Box
          x={300}
          y={20}
          w={290}
          h={250}
          accent
          title="Cloudinary"
          lines={["Upload preset + eval gate", "EXIF, pHash, faces, focus", "Backup + versioned storage", "AI Vision (JSON schema)", "Named transformations", "Moderation · metadata · Search", "PDF packs (multi)"]}
        />
        <Box x={300} y={300} w={290} h={82} title="Claude" lines={["Search planner · story writer", "reasons over records only"]} />

        <Box x={690} y={20} w={280} h={140} title="Next.js API (Node runtime)" lines={["Webhook, signature checked", "Trust engine, 8 signals", "Review server action"]} />
        <Box x={690} y={190} w={280} h={192} title="Supabase Postgres" lines={["evidence · understanding", "review · pair · story", "PostGIS: geofences", "pHash Hamming search", "hash-chained ledger"]} />

        <Arrow d="M200 86 C 250 86, 250 70, 298 70" label="signed upload" lx={250} ly={58} />
        <Arrow d="M200 206 C 250 206, 250 150, 298 150" label="same preset" lx={250} ly={196} />
        <Arrow d="M592 70 L 688 70" label="webhook" lx={640} ly={58} />
        <Arrow d="M688 120 C 640 150, 640 170, 594 170" label="AI Vision call" lx={640} ly={146} />
        <Arrow d="M830 162 L 830 188" label="" lx={0} ly={0} />
        <Arrow d="M200 336 C 400 300, 600 300, 688 250" label="decision" lx={420} ly={296} />
        <Arrow d="M594 340 C 640 340, 650 320, 688 300" label="SQL" lx={640} ly={352} />
      </svg>
    </div>
  );
}
