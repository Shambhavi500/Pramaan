"use client";

import { usePathname } from "next/navigation";

export type AtmosphereMode = "ambient" | "quiet";

/** Layers 0-3 of the cloud environment (design.md section 3). CSS only, static, never interactive. */
export function AtmosphericBackground({ mode }: { mode?: AtmosphereMode }) {
  const pathname = usePathname();
  const resolved = mode ?? (pathname === "/prototype" || pathname === "/discover" ? "ambient" : "quiet");
  return <div className="atmosphere" data-atmosphere={resolved} aria-hidden />;
}
