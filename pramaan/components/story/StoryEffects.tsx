"use client";

import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Progressive enhancement. Server-rendered content is fully visible; when motion is allowed this
 * hides `[data-reveal]` elements just before they enter the viewport and animates them in, and
 * counts `[data-count]` numbers up from zero.
 */
export function StoryEffects() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.from("[data-hero] > *", { opacity: 0, y: 24, duration: 0.9, ease: "power3.out", stagger: 0.12 });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 28,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 90%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
        const end = Number(el.dataset.count);
        const suffix = el.dataset.suffix ?? "";
        const state = { v: 0 };
        el.textContent = "0" + suffix;
        ScrollTrigger.create({
          trigger: el,
          start: "top 92%",
          once: true,
          onEnter: () =>
            gsap.to(state, {
              v: end,
              duration: 1.5,
              ease: "power2.out",
              onUpdate: () => {
                el.textContent = Math.round(state.v) + suffix;
              },
            }),
        });
      });
    });

    return () => ctx.revert();
  }, []);

  return null;
}
