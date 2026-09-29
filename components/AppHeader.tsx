"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/Brand";

const NAV = [
  { href: "/prototype", label: "Overview" },
  { href: "/capture", label: "Capture" },
  { href: "/import", label: "Import" },
  { href: "/review", label: "Review" },
  { href: "/compare/pair_01", label: "Compare", match: "/compare" },
  { href: "/verify/dv_8f9a2b", label: "Verify", match: "/verify" },
];

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-5 py-3">
        <Brand />
        <nav className="-mx-1 flex flex-1 items-center gap-1 overflow-x-auto no-scrollbar" aria-label="Prototype">
          {NAV.map((n) => {
            const active = pathname === n.href || pathname.startsWith(n.match ?? n.href + "/");
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition ${
                  active ? "bg-white/10 font-medium text-white" : "text-soft hover:text-white"
                }`}
              >
                {n.label}
              </Link>
            );
          })}
        </nav>
        <Link href="/" className="btn-lime hidden sm:inline-flex">
          Read the story
        </Link>
      </div>
    </header>
  );
}
