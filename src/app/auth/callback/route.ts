import { NextResponse, type NextRequest } from "next/server";

import { getSafeInternalPath } from "@/features/auth/safe-redirect";
import {
  applySupabaseResponseMutations,
  createSupabaseResponseMutations,
} from "@/lib/supabase/response-mutations";
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

  const responseMutations = createSupabaseResponseMutations();
  const supabase = await createServerSupabaseClient({ responseMutations });
  const finalizeResponse = (response: NextResponse) =>
    applySupabaseResponseMutations(response, responseMutations);

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return finalizeResponse(callbackFailureResponse(request));
    }
  } catch {
    return finalizeResponse(callbackFailureResponse(request));
  }

  const nextPath = getSafeInternalPath(
    request.nextUrl.searchParams.get("next"),
  );
  return finalizeResponse(
    NextResponse.redirect(new URL(nextPath, request.url)),
  );
}
