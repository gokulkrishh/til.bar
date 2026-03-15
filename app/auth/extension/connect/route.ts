import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/extension/callback?redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}`,
    },
  });

  if (error || !data.url) {
    return NextResponse.json(
      { error: "Failed to initiate sign-in" },
      { status: 500 },
    );
  }

  return NextResponse.redirect(data.url);
}
