import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { AtmosphericBackground } from "@/components/ui/AtmosphericBackground";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen">
      <AtmosphericBackground />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-sm focus:bg-white focus:px-3 focus:py-2">
        Skip to content
      </a>
      <AppHeader />
      <main id="main" className="mx-auto max-w-[1360px] px-5 pt-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
