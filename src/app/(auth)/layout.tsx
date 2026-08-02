import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-svh bg-muted/40 px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-5xl items-center justify-center sm:min-h-[calc(100svh-6rem)]">
        {children}
      </div>
    </main>
  );
}
