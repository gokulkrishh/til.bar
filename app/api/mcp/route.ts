import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { fetchMetadata } from "@/lib/metadata";
import crypto from "crypto";

function createMcpServer(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const server = new McpServer({
    name: "til-bar",
    version: "1.0.0",
  });

  server.registerTool(
    "list_links",
    {
      description: "List all saved links, most recent first",
      inputSchema: {
        limit: z
          .number()
          .optional()
          .describe("Max number of links to return (default 50)"),
      },
    },
    async ({ limit }) => {
      const { data, error } = await supabase
        .from("tils")
        .select()
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit ?? 50);

      if (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `${data.length} links:\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "get_link",
    {
      description: "Get a saved link by its ID",
      inputSchema: {
        id: z.string().describe("The unique ID of the link"),
      },
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from("tils")
        .select()
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          { type: "text" as const, text: JSON.stringify(data, null, 2) },
        ],
      };
    },
  );

  server.registerTool(
    "save_link",
    {
      description:
        "Save a new link. Automatically fetches the page title and description.",
      inputSchema: {
        url: z.string().url().describe("The URL to save"),
      },
    },
    async ({ url }) => {
      const { title, description } = await fetchMetadata(url);

      const { data, error } = await supabase
        .from("tils")
        .insert({ user_id: userId, url, title, description })
        .select()
        .single();

      if (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Saved: ${title ?? url}\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "update_link",
    {
      description: "Update a saved link's title or description",
      inputSchema: {
        id: z.string().describe("The unique ID of the link"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description"),
      },
    },
    async ({ id, title, description }) => {
      const update: Record<string, string> = {};
      if (title !== undefined) update.title = title;
      if (description !== undefined) update.description = description;

      if (Object.keys(update).length === 0) {
        return {
          content: [{ type: "text" as const, text: "Nothing to update" }],
        };
      }

      const { data, error } = await supabase
        .from("tils")
        .update(update)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

      if (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text" as const,
            text: `Updated:\n${JSON.stringify(data, null, 2)}`,
          },
        ],
      };
    },
  );

  server.registerTool(
    "delete_link",
    {
      description: "Delete a saved link by its ID",
      inputSchema: {
        id: z.string().describe("The unique ID of the link to delete"),
      },
    },
    async ({ id }) => {
      const { error } = await supabase
        .from("tils")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        return {
          content: [{ type: "text" as const, text: `Error: ${error.message}` }],
          isError: true,
        };
      }

      return {
        content: [{ type: "text" as const, text: `Deleted link ${id}` }],
      };
    },
  );

  return server;
}

async function authenticateRequest(
  req: Request,
): Promise<{ userId: string; token: string } | null> {
  const authHeader = req.headers.get("authorization");
  // Support API key via query param for clients that can't set headers (e.g. Claude.ai connectors)
  const url = new URL(req.url);
  const queryKey = url.searchParams.get("api_key");

  const token =
    queryKey ??
    (authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null);
  if (!token) return null;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  // API key auth: tokens prefixed with mcp_sk_ are looked up by hash
  if (token.startsWith("mcp_sk_")) {
    const keyHash = crypto.createHash("sha256").update(token).digest("hex");
    const { data, error } = await supabase
      .from("api_keys")
      .select("user_id")
      .eq("key_hash", keyHash)
      .single();

    if (error || !data) return null;
    return { userId: data.user_id, token };
  }

  // Fall back to Supabase session token (browser users)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  return { userId: user.id, token };
}

async function handleMcpRequest(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);

  // Allow GET requests without auth so Claude can complete the MCP protocol
  // handshake (capability discovery) before sending credentials.
  if (!auth && req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const server = createMcpServer(auth?.userId ?? "");

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(req, {
    authInfo: auth
      ? { token: auth.token, clientId: "til-bar", scopes: [] }
      : undefined,
  });

  return response;
}

export async function POST(req: Request) {
  return handleMcpRequest(req);
}

export async function GET(req: Request) {
  return handleMcpRequest(req);
}

export async function DELETE(req: Request) {
  return handleMcpRequest(req);
}
