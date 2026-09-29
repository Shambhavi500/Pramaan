import Link from "next/link";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`} aria-label="Pramaan home">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-lime text-base font-bold text-lime-ink" aria-hidden>
        प्र
      </span>
      <span className="text-xl font-normal tracking-tight">Pramaan</span>
    </Link>
  );
}
