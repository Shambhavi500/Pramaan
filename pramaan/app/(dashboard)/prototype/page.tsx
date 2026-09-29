import Link from "next/link";

const SCREENS = [
  {
    href: "/capture",
    tag: "Field",
    chip: "chip-lime",
    title: "Capture",
    desc: "Hash the photo, lock GPS, pick activity and phase, then upload straight to Cloudinary with a signed request.",
    uses: "Signed upload · upload preset · eval gate",
  },
  {
    href: "/import",
    tag: "Desk",
    chip: "chip-cyan",
    title: "Bulk import",
    desc: "Partner bundles from Drive, Dropbox or local files through the authenticated upload widget.",
    uses: "next-cloudinary widget · signature endpoint",
  },
  {
    href: "/review",
    tag: "Moderation",
    chip: "chip-lime",
    title: "Review queue",
    desc: "Flagged and needs-review evidence, worst first. V to verify, R to reject, both written to the ledger.",
    uses: "Moderation status · consent-aware delivery URLs",
  },
  {
    href: "/compare/pair_01",
    tag: "Change",
    chip: "chip-cyan",
    title: "Before / after",
    desc: "Drag a slider across two verified photos of the same site, delivered with fill and auto gravity.",
    uses: "c_fill · g_auto · f_auto · q_auto",
  },
  {
    href: "/verify/dv_8f9a2b",
    tag: "Public",
    chip: "chip-lime",
    title: "Verify",
    desc: "What a funder sees after scanning a QR: recipe, hashes, trust score and derivative class.",
    uses: "Named transformations · ETag · ledger",
  },
];

export default function PrototypeHub() {
  return (
    <div className="space-y-10">
      <div className="max-w-2xl space-y-4">
        <h1 className="text-5xl font-light tracking-tight">The prototype</h1>
        <p className="text-lg text-soft">
          Five working screens. New here? The{" "}
          <Link href="/" className="link">
            scroll story
          </Link>{" "}
          walks through how each one uses Cloudinary.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {SCREENS.map((s) => (
          <Link key={s.href} href={s.href} className="panel group flex flex-col gap-3 p-6 transition hover:border-lime/60">
            <span className={s.chip + " self-start"}>{s.tag}</span>
            <h2 className="text-2xl font-normal">{s.title}</h2>
            <p className="flex-1 font-light text-white/85">{s.desc}</p>
            <p className="text-xs font-medium text-muted">{s.uses}</p>
            <span className="text-sm font-medium text-link group-hover:text-white">Open →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
