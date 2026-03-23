export const MCP_TOOLS = [
  {
    name: "save_link",
    description: "Save a URL with auto-fetched metadata and AI-generated tags",
  },
  {
    name: "list_links",
    description: "List saved links with tags, filter by tag",
  },
  {
    name: "search_links",
    description: "Search links by keyword, filter by tag",
  },
  { name: "get_link", description: "Get a saved link with tags by ID" },
  { name: "update_link", description: "Update title, description, or tags" },
  { name: "delete_link", description: "Delete a saved link" },
] as const;
