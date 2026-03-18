import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const redirectUri = searchParams.get("redirect_uri");

  if (!redirectUri) {
    return NextResponse.json(
      { error: "Missing redirect_uri" },
      { status: 400 },
    );
  }

  // Implicit flow: Supabase redirects directly to extension with tokens in hash
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(oauthUrl);
}
