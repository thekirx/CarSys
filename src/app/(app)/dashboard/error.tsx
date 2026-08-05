"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Dashboard error", error);
  }, [error]);
  return <section className="error-state" role="alert">
    <span><AlertTriangle size={24} /></span>
    <p className="eyebrow">Dashboard unavailable</p>
    <h2>We could not load this workspace summary.</h2>
    <p>Check the connection and try again. Your organization and permission boundaries remain unchanged.</p>
    <button className="button button-primary" onClick={reset}><RotateCcw size={16} /> Retry dashboard</button>
  </section>;
}
