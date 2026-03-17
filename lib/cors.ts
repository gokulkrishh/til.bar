const ALLOWED_ORIGINS = ["https://til.bar"];

function isAllowedOrigin(origin: string) {
  return (
    origin.startsWith("chrome-extension://") || ALLOWED_ORIGINS.includes(origin)
  );
}

export function getCorsHeaders(
  req: Request,
  { allowedHeaders = "Content-Type" }: { allowedHeaders?: string } = {},
): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": allowedHeaders,
  };

  if (origin && isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  }

  return headers;
}
