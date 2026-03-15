import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  if (!redirectUri || !state) {
    return NextResponse.json(
      { error: "Missing redirect_uri or state" },
      { status: 400 },
    );
  }

  // Build Supabase OAuth URL directly
  // redirectTo tells Supabase where to send the code after Google auth
  const callbackUrl = `${origin}/auth/extension/callback?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl)}`;

  return NextResponse.redirect(oauthUrl);
}
