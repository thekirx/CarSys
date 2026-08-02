import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOutAction } from "@/features/auth/actions";

export const metadata: Metadata = {
  title: "Access temporarily unavailable | Apex Autohaus",
};

export default function AccessUnavailablePage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Organization access temporarily unavailable</CardTitle>
          <CardDescription>
            We could not load your organization access. No organization data
            has been shown.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Try again. If the problem continues, contact your system
            administrator.
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2">
          <Button render={<Link href="/dashboard" />}>Try again</Button>
          <form action={signOutAction}>
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardFooter>
      </Card>
    </main>
  );
}
