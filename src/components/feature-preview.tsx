import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Blocks, CheckCircle2 } from "lucide-react";

export function FeaturePreview({ title, description, phase, capabilities }: { title: string; description: string; phase: string; capabilities: string[] }) {
  return <div className="feature-preview"><section><span className="feature-preview-icon"><Blocks size={26} /></span><p className="eyebrow">Product roadmap · {phase}</p><h2>{title}</h2><p>{description}</p><div className="feature-capabilities">{capabilities.map((capability) => <span key={capability}><CheckCircle2 size={15} />{capability}</span>)}</div><div className="feature-actions"><Link className="button button-secondary" href="/dashboard"><ArrowLeft size={15} /> Dashboard</Link><Link className="button button-primary" href="/vehicles">View Phase 1 inventory <ArrowUpRight size={15} /></Link></div></section><aside><strong>Foundation ready</strong><p>The tenancy, role, branch, and audit boundaries required by this workflow are already established in Phase 1.</p><div className="foundation-meter"><span /></div><small>Architecture contract complete</small></aside></div>;
}
