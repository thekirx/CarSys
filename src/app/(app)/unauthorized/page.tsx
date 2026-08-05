import Link from "next/link";
import { ShieldX } from "lucide-react";
export default function UnauthorizedPage() {
  return <div className="empty-state"><ShieldX size={42} /><h1>Access restricted</h1><p>Your account does not have permission to open this workspace area.</p><Link className="button button-primary" href="/dashboard">Return to dashboard</Link></div>;
}
