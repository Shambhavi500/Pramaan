"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Brand } from "@/components/Brand";

export const CHAPTERS = [
  { id: "problem", label: "Problem" },
  { id: "pipeline", label: "Pipeline" },
  { id: "capture", label: "Capture" },
  { id: "understand", label: "Understand" },
  { id: "trust", label: "Trust" },
  { id: "review", label: "Review" },
  { id: "firewall", label: "Firewall" },
  { id: "compare", label: "Compare" },
  { id: "discover", label: "Discover" },
  { id: "verify", label: "Verify" },
  { id: "map", label: "Cloudinary map" },
  { id: "status", label: "Status" },
];

export function StoryNav() {
  const bar = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("");

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
        if (bar.current) bar.current.style.transform = `scaleX(${p})`;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-40% 0px -55% 0px" }
    );
    CHAPTERS.forEach((c) => {
      const el = document.getElementById(c.id);
      if (el) io.observe(el);
    });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-ink/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-5 py-3">
        <Brand />
        <nav className="hidden flex-1 items-center gap-1 overflow-x-auto no-scrollbar xl:flex" aria-label="Chapters">
          {CHAPTERS.map((c) => (
            <a
              key={c.id}
              href={`#${c.id}`}
              aria-current={active === c.id ? "true" : undefined}
              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] transition ${
                active === c.id ? "bg-white/10 font-medium text-white" : "text-soft hover:text-white"
              }`}
            >
              {c.label}
            </a>
          ))}
        </nav>
        <div className="flex-1 xl:hidden" />
        <Link href="/prototype" className="btn-lime">
          Open the prototype
        </Link>
      </div>
      <div className="h-[2px] w-full bg-white/5">
        <div ref={bar} className="h-full origin-left bg-lime" style={{ transform: "scaleX(0)" }} />
      </div>
    </header>
  );
}
