import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import { fetchMetadata } from "@/lib/metadata";
import { authenticateToken } from "@/lib/auth";
import { generateTags } from "@/lib/ai-tags";
import { getTilIdsByTag, upsertTags } from "@/lib/tag-utils";

function mcpText(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function mcpError(message: string) {
  return {
    content: [{ type: "text" as const, text: `Error: ${message}` }],
    isError: true,
  };
}

function createMcpServer(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const server = new McpServer({
    name: "til-bar",
    version: "1.0.0",
    icons: [
      {
        src: "https://til.bar/icon.svg",
        mimeType: "image/svg+xml",
        sizes: ["any"],
      },
    ],
  });

  server.registerTool(
    "list_links",
    {
      description:
        "List saved links with their tags, most recent first. Supports pagination and filtering by tag.",
      inputSchema: {
        limit: z
          .number()
          .optional()
          .describe("Max number of links to return (default 50)"),
        offset: z
          .number()
          .optional()
          .describe("Number of links to skip for pagination (default 0)"),
        tag: z
          .string()
          .optional()
          .describe("Filter by tag name (e.g. 'react', 'css')"),
      },
    },
    async ({ limit, offset, tag }) => {
      const pageSize = limit ?? 50;
      const from = offset ?? 0;

      const tilIds = tag
        ? await getTilIdsByTag(supabase, userId, tag)
        : undefined;
      if (tag && !tilIds) return mcpText(`No links found with tag "${tag}"`);

      let countQuery = supabase
        .from("tils")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      let dataQuery = supabase
        .from("tils")
        .select("*, tags:til_tags(...tags(*))")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (tilIds) {
        countQuery = countQuery.in("id", tilIds);
        dataQuery = dataQuery.in("id", tilIds);
      }

      const [{ count }, { data, error }] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      if (error) return mcpError(error.message);

      const tagSuffix = tag ? ` with tag "${tag}"` : "";
      return mcpText(
        `Showing ${data.length} of ${count ?? "unknown"} total links${tagSuffix} (offset: ${from}):\n${JSON.stringify(data, null, 2)}`,
      );
    },
  );

  server.registerTool(
    "search_links",
    {
      description:
        "Search saved links by keyword. Matches against title, description, and URL. Supports pagination and filtering by tag.",
      inputSchema: {
        query: z.string().describe("Search keyword"),
        limit: z
          .number()
          .optional()
          .describe("Max number of results to return (default 20)"),
        offset: z
          .number()
          .optional()
          .describe("Number of results to skip for pagination (default 0)"),
        tag: z
          .string()
          .optional()
          .describe("Filter by tag name (e.g. 'react', 'css')"),
      },
    },
    async ({ query, limit, offset, tag }) => {
      const pageSize = limit ?? 20;
      const from = offset ?? 0;
      const pattern = `%${query}%`;
      const filter = `title.ilike.${pattern},description.ilike.${pattern},url.ilike.${pattern}`;

      const tilIds = tag
        ? await getTilIdsByTag(supabase, userId, tag)
        : undefined;
      if (tag && !tilIds)
        return mcpText(`No links found matching "${query}" with tag "${tag}"`);

      let countQuery = supabase
        .from("tils")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .or(filter);

      let dataQuery = supabase
        .from("tils")
        .select("*, tags:til_tags(...tags(*))")
        .eq("user_id", userId)
        .or(filter)
        .order("created_at", { ascending: false })
        .range(from, from + pageSize - 1);

      if (tilIds) {
        countQuery = countQuery.in("id", tilIds);
        dataQuery = dataQuery.in("id", tilIds);
      }

      const [{ count }, { data, error }] = await Promise.all([
        countQuery,
        dataQuery,
      ]);

      if (error) return mcpError(error.message);
      if (data.length === 0)
        return mcpText(`No links found matching "${query}"`);

      return mcpText(
        `Showing ${data.length} of ${count ?? "unknown"} matches for "${query}" (offset: ${from}):\n${JSON.stringify(data, null, 2)}`,
      );
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
        .select("*, tags:til_tags(...tags(*))")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) return mcpError(error.message);
      return mcpText(JSON.stringify(data, null, 2));
    },
  );

  server.registerTool(
    "save_link",
    {
      description:
        "Save a new link. Automatically fetches the page title, description, and generates tags via AI.",
      inputSchema: {
        url: z.url().describe("The URL to save"),
      },
    },
    async ({ url }) => {
      const { title, description } = await fetchMetadata(url);

      const { data, error } = await supabase
        .from("tils")
        .insert({ user_id: userId, url, title, description })
        .select()
        .single();

      if (error) return mcpError(error.message);

      await generateTags({ ...data, title, description });

      const { data: saved } = await supabase
        .from("tils")
        .select("*, tags:til_tags(...tags(*))")
        .eq("id", data.id)
        .single();

      return mcpText(
        `Saved: ${title ?? url}\n${JSON.stringify(saved ?? data, null, 2)}`,
      );
    },
  );

  server.registerTool(
    "update_link",
    {
      description:
        "Update a saved link's title, description, or tags. When tags are provided, they replace all existing tags.",
      inputSchema: {
        id: z.string().describe("The unique ID of the link"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description"),
        tags: z
          .array(z.string())
          .optional()
          .describe(
            "Replace all tags with these (e.g. ['react', 'css']). Pass empty array to remove all tags.",
          ),
      },
    },
    async ({ id, title, description, tags }) => {
      const { count } = await supabase
        .from("tils")
        .select("id", { count: "exact", head: true })
        .eq("id", id)
        .eq("user_id", userId);

      if (!count) return mcpError("Link not found");

      const update: Record<string, string> = {};
      if (title !== undefined) update.title = title;
      if (description !== undefined) update.description = description;

      const hasTags = tags !== undefined;
      if (Object.keys(update).length === 0 && !hasTags)
        return mcpText("Nothing to update");

      if (Object.keys(update).length > 0) {
        const { error } = await supabase
          .from("tils")
          .update(update)
          .eq("id", id)
          .eq("user_id", userId);

        if (error) return mcpError(error.message);
      }

      if (hasTags) {
        await supabase.from("til_tags").delete().eq("til_id", id);
        if (tags.length) {
          await upsertTags(supabase, userId, id, tags);
        }
      }

      const { data, error } = await supabase
        .from("tils")
        .select("*, tags:til_tags(...tags(*))")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

      if (error) return mcpError(error.message);
      return mcpText(`Updated:\n${JSON.stringify(data, null, 2)}`);
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

      if (error) return mcpError(error.message);
      return mcpText(`Deleted link ${id}`);
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

  const userId = await authenticateToken(token);
  if (!userId) return null;

  return { userId, token };
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
