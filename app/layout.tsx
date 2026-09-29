import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Pramaan (प्रमाण): proof for every photo",
  description:
    "An evidence pipeline for field media, built on Cloudinary: signed upload, an intake gate, AI Vision, a trust score and a tamper-evident ledger.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#101926" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
