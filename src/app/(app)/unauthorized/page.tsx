import type { Metadata } from "next";

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
  title: "Access unavailable | Apex Autohaus",
};

export default function UnauthorizedPage() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 px-4 py-8">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Organization access unavailable</CardTitle>
          <CardDescription>
            Your identity is authenticated, but it does not have a usable active
            organization membership. Ask an organization owner to review your
            access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No organization data has been loaded for this session.
          </p>
        </CardContent>
        <CardFooter>
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
