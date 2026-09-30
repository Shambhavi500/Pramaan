import Link from "next/link";
import { Logo } from "./Logo";

export function Brand({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 ${className}`} aria-label="Pramaan home">
      <Logo size={30} />
      <span className="font-display text-xl tracking-tight">Pramaan</span>
    </Link>
  );
}
