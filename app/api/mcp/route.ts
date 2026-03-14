import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { fetchMetadata } from "@/lib/metadata";

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
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) return null;

  return { userId: user.id, token };
}

async function handleMcpRequest(req: Request): Promise<Response> {
  const auth = await authenticateRequest(req);
  if (!auth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const server = createMcpServer(auth.userId);

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
  });

  await server.connect(transport);

  const response = await transport.handleRequest(req, {
    authInfo: {
      token: auth.token,
      clientId: "til-bar",
      scopes: [],
    },
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
