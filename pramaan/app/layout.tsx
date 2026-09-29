import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pramaan (प्रमाण) — Verifiable Evidence Platform",
  description: "AI media intelligence and verifiable evidence for NGOs, CSR funders and public welfare programs.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
