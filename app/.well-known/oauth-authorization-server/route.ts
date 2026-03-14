export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return Response.json({
    issuer: supabaseUrl,
    authorization_endpoint: `${supabaseUrl}/auth/v1/authorize`,
    token_endpoint: `${supabaseUrl}/auth/v1/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    code_challenge_methods_supported: ["S256"],
    token_endpoint_auth_methods_supported: ["none"],
  });
}
