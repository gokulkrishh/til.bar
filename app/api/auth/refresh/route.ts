import { createClient } from "@supabase/supabase-js";
import { getCorsHeaders } from "@/lib/cors";

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) });
}

export async function POST(req: Request) {
  const corsHeaders = getCorsHeaders(req);
  let body: { refresh_token?: string };

  try {
    body = await req.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400, headers: corsHeaders },
    );
  }

  const refreshToken = body.refresh_token;

  if (!refreshToken) {
    return Response.json(
      { error: "Missing refresh_token" },
      { status: 400, headers: corsHeaders },
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );

  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session) {
    return Response.json(
      { error: "Invalid refresh token" },
      { status: 401, headers: corsHeaders },
    );
  }

  return Response.json(
    {
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
    },
    { headers: corsHeaders },
  );
}
