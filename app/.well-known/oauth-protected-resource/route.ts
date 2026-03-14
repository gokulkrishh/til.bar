export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  return Response.json({
    resource: process.env.NEXT_PUBLIC_APP_URL ?? "https://til.bar",
    authorization_servers: [supabaseUrl],
  });
}
