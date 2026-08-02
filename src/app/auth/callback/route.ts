import { NextResponse, type NextRequest } from "next/server";

import { getSafeInternalPath } from "@/features/auth/safe-redirect";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const callbackFailureResponse = (request: NextRequest) => {
  const destination = new URL("/sign-in", request.url);
  destination.searchParams.set("error", "authentication");
  return NextResponse.redirect(destination);
};

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return callbackFailureResponse(request);
  }

  const supabase = await createServerSupabaseClient();
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return callbackFailureResponse(request);
    }
  } catch {
    return callbackFailureResponse(request);
  }

  const nextPath = getSafeInternalPath(
    request.nextUrl.searchParams.get("next"),
  );
  return NextResponse.redirect(new URL(nextPath, request.url));
}
