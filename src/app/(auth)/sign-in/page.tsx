import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SignInForm } from "@/features/auth/sign-in-form";
import { getSafeInternalPath } from "@/features/auth/safe-redirect";

export const metadata: Metadata = {
  title: "Sign in | Apex Autohaus",
};

const demoRoles = [
  ["Owner", "owner@apex-autohaus.example"],
  ["Branch Manager", "branch.manager@apex-autohaus.example"],
  ["Sales Agent", "sales.agent@apex-autohaus.example"],
  ["Inventory Staff", "inventory.staff@apex-autohaus.example"],
  ["Viewer", "viewer@apex-autohaus.example"],
] as const;

type SignInPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const nextPath = getSafeInternalPath(params.next);
  const callbackFailed = params.error === "authentication";

  return (
    <div className="grid w-full gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)]">
      <Card className="w-full">
        <CardHeader className="gap-3">
          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex size-10 items-center justify-center rounded-lg bg-primary font-heading text-lg font-semibold text-primary-foreground"
            >
              A
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="font-heading text-sm font-semibold">Apex Autohaus</p>
              <p className="text-xs text-muted-foreground">Operations command center</p>
            </div>
          </div>
          <CardTitle>
            <h1>Welcome to Apex Autohaus</h1>
          </CardTitle>
          <CardDescription>
            Sign in to continue to your organization workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm nextPath={nextPath} callbackFailed={callbackFailed} />
        </CardContent>
      </Card>

      <aside aria-label="Demo role reference">
        <Card className="h-full" size="sm">
          <CardHeader>
            <CardTitle>Demo role reference</CardTitle>
            <CardDescription>
              Trusted bootstrap required. These fictional identities are role
              references only and may not exist in the configured project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-3">
              {demoRoles.map(([role, email]) => (
                <div key={role} className="flex flex-col gap-0.5">
                  <dt className="text-sm font-medium">{role}</dt>
                  <dd className="break-all text-xs text-muted-foreground">
                    {email}
                  </dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
