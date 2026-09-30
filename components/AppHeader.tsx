"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Camera,
  ClipboardCheck,
  GitCompare,
  Images,
  LayoutDashboard,
  Search,
  Sparkles,
  ShieldCheck,
  Target,
  Upload,
  type LucideIcon,
} from "lucide-react";
import { Brand } from "@/components/Brand";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
  match?: string;
}

// The navigation is the evidence lifecycle: bring in, understand, use, prove.
const GROUPS: { label: string; items: NavItem[] }[] = [
  { label: "Overview", items: [{ href: "/prototype", label: "Overview", Icon: LayoutDashboard }] },
  {
    label: "Bring in",
    items: [
      { href: "/capture", label: "Capture", Icon: Camera },
      { href: "/import", label: "Import", Icon: Upload },
    ],
  },
  {
    label: "Understand",
    items: [
      { href: "/evidence", label: "Evidence", Icon: Images },
      { href: "/review", label: "Review", Icon: ClipboardCheck },
    ],
  },
  {
    label: "Use",
    items: [
      { href: "/compare/pair_01", label: "Compare", Icon: GitCompare, match: "/compare" },
      { href: "/discover", label: "Discover", Icon: Search },
      { href: "/investigate", label: "Investigate", Icon: Sparkles },
      { href: "/claims", label: "Impact", Icon: Target },
      { href: "/stories", label: "Stories", Icon: BookOpen },
    ],
  },
  { label: "Prove", items: [{ href: "/verify/dv_8f9a2b", label: "Verify", Icon: ShieldCheck, match: "/verify" }] },
];

export function AppHeader() {
  const pathname = usePathname();
  return (
    <header className="glass sticky top-0 z-40 rounded-none border-x-0 border-t-0 border-b-cloud-200 shadow-none">
      <div className="mx-auto flex max-w-[1360px] items-center gap-6 px-5 py-2.5">
        <Brand />
        <nav className="no-scrollbar -mx-1 flex flex-1 items-center gap-6 overflow-x-auto" aria-label="Evidence lifecycle">
          {GROUPS.map((g) => (
            <ul key={g.label} className="flex items-center gap-0.5" aria-label={g.label}>
              {g.items.map(({ href, label, Icon, match }) => {
                const active = pathname === href || pathname.startsWith((match ?? href) + "/") || pathname === match;
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-sm px-2.5 py-2 text-[13px] transition-colors ${
                        active ? "font-semibold text-ink-900" : "text-ink-600 hover:bg-sky-50 hover:text-ink-900"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} aria-hidden />
                      <span className="hidden md:inline">{label}</span>
                      <span className="sr-only md:hidden">{label}</span>
                      {active && <span className="absolute inset-x-2.5 -bottom-[11px] h-0.5 bg-sky-600" aria-hidden />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ))}
        </nav>
        <Link href="/" className="btn-outline hidden !py-1.5 text-[13px] lg:inline-flex">
          Read the story
        </Link>
      </div>
    </header>
  );
}
