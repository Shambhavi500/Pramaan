import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="glow min-h-screen">
      <AppHeader />
      <main className="mx-auto max-w-6xl px-5 pt-10">{children}</main>
      <SiteFooter />
    </div>
  );
}
