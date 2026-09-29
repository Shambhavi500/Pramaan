import Link from "next/link";

const routes = [
  { href: "/capture", title: "Field Capture", desc: "Hash + geotag a photo and upload it with a signed request." },
  { href: "/import", title: "Bulk Ingest", desc: "Desk import through the authenticated Cloudinary widget." },
  { href: "/review", title: "Review Queue", desc: "Moderate flagged evidence." },
  { href: "/compare/pair_01", title: "Before / After", desc: "Slider comparison for a site pair." },
  { href: "/verify/dv_8f9a2b", title: "Public Verify", desc: "Lineage inspector for a published derivative." },
];

export default function Home() {
  return (
    <main className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pramaan (प्रमाण)</h1>
        <p className="text-sm text-muted-foreground mt-1">Verifiable field evidence, powered by Cloudinary.</p>
      </div>
      <div className="grid gap-3">
        {routes.map((r) => (
          <Link key={r.href} href={r.href} className="block border rounded-xl bg-white p-4 hover:border-emerald-500">
            <p className="font-semibold">{r.title}</p>
            <p className="text-xs text-muted-foreground">{r.desc}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
