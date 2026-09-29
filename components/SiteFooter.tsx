import { Brand } from "@/components/Brand";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-navy pb-10 pt-16 text-sm font-medium text-soft">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Brand />
          <p className="max-w-sm font-light">
            प्रमाण means proof. A hackathon prototype for Code Cubicle 6.0, built on Cloudinary. Not affiliated with or
            endorsed by Cloudinary.
          </p>
        </div>
        <p className="font-light">Next.js · Cloudinary · Supabase · Claude</p>
      </div>
    </footer>
  );
}
