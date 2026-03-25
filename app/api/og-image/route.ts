import { fetchMetadata } from "@/lib/metadata";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");

  if (!url) {
    return Response.json({ error: "Missing url param" }, { status: 400 });
  }

  const { image } = await fetchMetadata(url);

  return Response.json({ image });
}
