"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export interface Step {
  kicker: string;
  title: string;
  body: ReactNode;
}

/**
 * Scroll-driven scene. Text steps scroll on the left; the visual for the step nearest the middle of
 * the viewport is pinned on the right (large screens). On small screens each visual sits under its text.
 */
export function Scrolly({ steps, visuals }: { steps: Step[]; visuals: ReactNode[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(Number(e.target.getAttribute("data-i")));
        }),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <div className="grid gap-x-14 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <div>
        {steps.map((s, i) => (
          <div
            key={s.title}
            ref={(el) => {
              refs.current[i] = el;
            }}
            data-i={i}
            className="flex flex-col justify-center py-10 lg:min-h-[85vh]"
          >
            <div className={`transition-opacity duration-500 ${i === active ? "opacity-100" : "lg:opacity-35"}`}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-lime">{s.kicker}</p>
              <h3 className="mb-4 text-3xl font-light leading-tight tracking-tight sm:text-4xl">{s.title}</h3>
              <div className="space-y-3 text-base font-light leading-relaxed text-white/85">{s.body}</div>
            </div>
            <div className="mt-8 lg:hidden">{visuals[i]}</div>
          </div>
        ))}
      </div>

      <div className="hidden lg:block">
        <div className="sticky top-24 flex h-[calc(100vh-8rem)] items-center">
          <div className="relative h-full w-full">
            {visuals.map((v, i) => (
              <div
                key={i}
                aria-hidden={i !== active}
                className={`absolute inset-0 flex items-center transition-all duration-500 ${
                  i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
                }`}
              >
                <div className="w-full">{v}</div>
              </div>
            ))}
            <div className="absolute -bottom-1 right-0 flex gap-1.5" aria-hidden>
              {steps.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-lime" : "w-1.5 bg-white/25"}`} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
