import { ShieldCheck } from "lucide-react";

/**
 * Hero atmosphere (design.md sections 3.3 and 19): a blurred cloud bank rising from the horizon, with a few
 * floating evidence fragments and a lineage line. Pure CSS/SVG. Blur is applied to the cloud ellipses only,
 * never to a full-viewport backdrop or to any evidence content.
 */
export function CloudHero() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* light fields */}
      <div className="absolute -left-[10%] -top-[20%] h-[70%] w-[60%] rounded-full bg-sky-600/30 blur-[90px]" />
      <div className="absolute -right-[10%] top-[5%] h-[50%] w-[45%] rounded-full bg-cyan-500/10 blur-[90px]" />

      {/* cloud bank: three depths, slow drift */}
      <div className="absolute inset-x-0 bottom-0 h-[55%]">
        <div className="absolute -left-[10%] bottom-[-18%] h-[60%] w-[70%] rounded-full bg-sky-200/25 blur-[70px] [animation:cloud-bank_22s_ease-in-out_infinite]" />
        <div className="absolute -right-[15%] bottom-[-22%] h-[70%] w-[75%] rounded-full bg-white/20 blur-[80px] [animation:cloud-bank_28s_ease-in-out_infinite_reverse]" />
        <div className="absolute left-[20%] bottom-[-30%] h-[60%] w-[70%] rounded-full bg-sky-100/25 blur-[90px]" />
      </div>
      {/* horizon handoff into the story below */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-atmosphere-900 to-transparent" />

      {/* floating evidence cluster (large screens only) */}
      <div className="absolute right-[3%] top-[14%] hidden h-[46%] w-[44%] lg:block">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 560 440" fill="none">
          <path d="M120 96 C 210 120, 250 210, 330 250" stroke="var(--color-cyan-300)" strokeOpacity=".5" strokeWidth="1" strokeDasharray="3 5" />
          <path d="M330 250 C 400 280, 440 330, 470 370" stroke="var(--color-cyan-300)" strokeOpacity=".5" strokeWidth="1" strokeDasharray="3 5" />
          <path d="M330 250 C 380 170, 420 120, 460 84" stroke="var(--color-cyan-300)" strokeOpacity=".35" strokeWidth="1" strokeDasharray="3 5" />
        </svg>

        {/* evidence card */}
        <div className="drift absolute left-[6%] top-[4%] w-56 rounded-lg border border-white/50 bg-white p-3 text-ink-900 shadow-elev-3">
          <div className="mb-2 h-1 w-full stripe-verified" />
          <div className="mb-2 h-24 rounded-md bg-gradient-to-br from-sky-100 via-sky-200 to-cyan-300" />
          <p className="mono-id text-ink-600">EV-2026-000418</p>
          <p className="text-sm font-semibold">Check dam, north bank</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="font-display text-xl tabular-nums">94</span>
            <span className="h-1.5 flex-1 rounded-xs bg-cloud-200">
              <span className="block h-full w-[94%] rounded-xs bg-verified" />
            </span>
            <span className="badge badge-verified">
              <ShieldCheck className="h-3 w-3" /> Verified
            </span>
          </div>
        </div>

        {/* hash chip */}
        <div className="absolute left-[46%] top-[42%] rounded-md border border-white/40 bg-white/90 px-3 py-2 font-mono text-[11px] text-ink-700 shadow-elev-2">
          sha256 a3f9c2…c81e <span className="text-verified-fg">✓ match</span>
        </div>

        {/* claim fragment */}
        <div className="drift absolute right-[2%] top-[2%] w-44 rounded-lg border border-white/50 bg-white p-3 text-ink-900 shadow-elev-2 [animation-delay:-4s]">
          <p className="overline">Evidence coverage</p>
          <p className="font-display text-3xl tabular-nums">84%</p>
          <div className="mt-1 flex h-2 gap-0.5">
            <span className="w-[68%] rounded-xs bg-sky-600" />
            <span className="hatch-flagged w-[8%] rounded-xs bg-flagged" />
            <span className="hatch-gap w-[24%] rounded-xs border border-dashed border-ink-400" />
          </div>
        </div>

        {/* before / after fragment */}
        <div className="absolute bottom-[8%] left-[10%] w-52 overflow-hidden rounded-lg border border-white/50 bg-white shadow-elev-3">
          <div className="relative h-20">
            <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-br from-cloud-200 to-sky-200" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-br from-sky-300 to-cyan-500/70" />
            <span className="absolute inset-y-0 left-1/2 w-px bg-white" />
            <span className="badge badge-neutral absolute left-1.5 top-1.5 bg-white !px-1.5 !py-0.5 !text-[9px]">Before</span>
            <span className="badge badge-neutral absolute right-1.5 top-1.5 bg-white !px-1.5 !py-0.5 !text-[9px]">After</span>
          </div>
          <p className="px-3 py-2 font-mono text-[11px] text-ink-700">Δ ExG +0.184 · 5 months</p>
        </div>

        {/* map fragment with geofence */}
        <div className="drift absolute bottom-[2%] right-[4%] h-32 w-40 overflow-hidden rounded-lg border border-white/50 bg-cloud-50 shadow-elev-2 [animation-delay:-2s]">
          <svg viewBox="0 0 160 128" className="h-full w-full">
            <path d="M0 90 C 40 70, 70 100, 160 60" stroke="var(--color-sky-200)" strokeWidth="10" fill="none" />
            <path d="M0 30 H160 M0 64 H160 M0 98 H160 M40 0 V128 M80 0 V128 M120 0 V128" stroke="var(--color-cloud-200)" strokeWidth=".6" />
            <polygon points="52,40 108,34 116,84 60,92" fill="var(--color-sky-600)" fillOpacity=".08" stroke="var(--color-sky-600)" strokeWidth="1.4" strokeDasharray="4 3" />
            <circle cx="84" cy="62" r="5" fill="var(--color-sky-600)" stroke="#fff" strokeWidth="2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
