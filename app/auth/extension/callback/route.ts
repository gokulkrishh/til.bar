import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const redirectUri = searchParams.get("redirect_uri");
  const state = searchParams.get("state");

  if (!code || !redirectUri || !state) {
    return NextResponse.json(
      { error: "Missing code, redirect_uri, or state" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.session) {
    return NextResponse.redirect(
      `${redirectUri}?error=auth_failed&state=${encodeURIComponent(state)}`,
    );
  }

  const session = {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
    user: {
      id: data.session.user.id,
      email: data.session.user.email,
      user_metadata: {
        full_name: data.session.user.user_metadata?.full_name,
        avatar_url: data.session.user.user_metadata?.avatar_url,
      },
    },
  };

  const sessionParam = encodeURIComponent(JSON.stringify(session));

  return NextResponse.redirect(
    `${redirectUri}?session=${sessionParam}&state=${encodeURIComponent(state)}`,
  );
}
