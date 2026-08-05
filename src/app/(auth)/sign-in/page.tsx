import { CarFront, CheckCircle2 } from "lucide-react";
import { SignInForm } from "@/features/auth/sign-in-form";

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <main className="auth-page">
      <section className="auth-brand-panel">
        <div className="brand-mark brand-mark-large"><CarFront size={27} /></div>
        <div className="auth-brand-copy">
          <p className="auth-kicker">Vehicle operations, without the blind spots.</p>
          <h1>Run every dealership decision from one clear command center.</h1>
          <p>Inventory, people, pipeline, and performance—securely organized for Philippine automotive teams.</p>
        </div>
        <ul className="auth-proof-list">
          <li><CheckCircle2 size={18} /> Tenant and branch-secure access</li>
          <li><CheckCircle2 size={18} /> Role-sensitive financial visibility</li>
          <li><CheckCircle2 size={18} /> Built for dealership workflows</li>
        </ul>
        <p className="auth-footnote">Apex Autohaus · Quezon City Main</p>
      </section>
      <section className="auth-form-panel">
        <div className="signin-card">
          <div className="signin-heading">
            <span className="mobile-auth-brand"><CarFront size={20} /> CarSys</span>
            <h2>Welcome back</h2>
            <p>Sign in to your organization workspace.</p>
          </div>
          <SignInForm next={next} />
          <p className="signin-security"><ShieldIcon /> Protected with Supabase authentication and Row Level Security.</p>
        </div>
      </section>
    </main>
  );
}

function ShieldIcon() { return <span aria-hidden="true">◆</span>; }
