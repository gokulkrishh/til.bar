import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  if (!redirectUri) {
    return NextResponse.json(
      { error: "Missing redirect_uri" },
      { status: 400 },
    );
  }

  // PKCE flow: route through callback to exchange the code server-side
  const callbackUrl = new URL(
    "/auth/extension/callback",
    process.env.NEXT_PUBLIC_SITE_URL || "https://til.bar",
  );
  callbackUrl.searchParams.set("redirect_uri", redirectUri);
  if (state) callbackUrl.searchParams.set("state", state);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(callbackUrl.toString())}`;

  return NextResponse.redirect(oauthUrl);
}
