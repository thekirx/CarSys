import { cn } from "@/lib/utils";
export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return <span className={cn("avatar", className)} aria-label={name}>{initials}</span>;
}
