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

  // Supabase implicit flow: redirect_to is the extension's chromiumapp.org URL
  // After Google sign-in, Supabase redirects directly to this URL with tokens in the hash
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const oauthUrl = `${supabaseUrl}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUri)}`;

  return NextResponse.redirect(oauthUrl);
}
