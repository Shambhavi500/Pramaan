import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";

const STAGES = [
  {
    stage: "Capture",
    items: [
      { href: "/capture", title: "Capture", desc: "Hash the photo, lock GPS, pick activity and phase, then upload straight to Cloudinary with a signed request.", uses: "Signed upload · upload preset · eval gate" },
      { href: "/import", title: "Import", desc: "Partner bundles from Drive, Dropbox or local files through the authenticated upload widget.", uses: "next-cloudinary widget · signature endpoint" },
    ],
  },
  {
    stage: "Understand and verify",
    items: [
      { href: "/evidence", title: "Evidence", desc: "Every asset as a floating evidence card: media, provenance, key signals and its trust score.", uses: "AI Vision · trust engine" },
      { href: "/review", title: "Review", desc: "Flagged and needs-review evidence, worst first. V to verify, R to reject, both written to the ledger.", uses: "Moderation status · consent-aware delivery URLs" },
    ],
  },
  {
    stage: "Compare, discover, prove",
    items: [
      { href: "/compare/pair_01", title: "Compare", desc: "Same site, two dates, side by side with the measured change and the method stated.", uses: "c_fill · g_auto · f_auto · q_auto" },
      { href: "/discover", title: "Discover", desc: "Ask in plain language. See how the question was interpreted and why each result matched.", uses: "Gemini planner · Cloudinary Search API" },
      { href: "/claims", title: "Impact", desc: "How strongly the verified evidence supports each claim, and which evidence is still missing.", uses: "Coverage scoring · claim to evidence links" },
    ],
  },
  {
    stage: "Tell and prove",
    items: [
      { href: "/stories", title: "Stories", desc: "Evidence-backed impact reports where every statement cites verified assets.", uses: "Grounded synthesis · PDF evidence pack" },
      { href: "/verify/dv_8f9a2b", title: "Verify", desc: "What a funder sees after scanning a QR: lineage from published output back to the original.", uses: "Named transformations · ETag · ledger" },
    ],
  },
];

export default function PrototypeHub() {
  return (
    <div className="pb-8">
      <PageHeader stage="Overview" title="From field media to verifiable impact">
        Capture, understand, verify, compare, discover, prove and tell. The navigation follows the same path. New here? The{" "}
        <Link href="/" className="font-medium text-sky-600 underline underline-offset-4 hover:text-sky-500">
          scroll story
        </Link>{" "}
        explains how each step uses Cloudinary.
      </PageHeader>

      <div className="space-y-10">
        {STAGES.map((g) => (
          <section key={g.stage} aria-label={g.stage}>
            <h2 className="overline mb-3">{g.stage}</h2>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {g.items.map((s) => (
                <Link key={s.href} href={s.href} className="surface-2 is-interactive group flex flex-col gap-2 p-5">
                  <h3 className="font-display text-2xl">{s.title}</h3>
                  <p className="flex-1 text-[15px] leading-relaxed text-ink-700">{s.desc}</p>
                  <p className="mono-meta">{s.uses}</p>
                  <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-sky-600">
                    Open <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
