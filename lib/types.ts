import type { Database } from "@/lib/supabase/types";

// Row aliases
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Til = Database["public"]["Tables"]["tils"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type TilTag = Database["public"]["Tables"]["til_tags"]["Row"];

// Settings shape (JSONB column on profiles)
export type ExportFormat = "json" | "markdown";

export type ProfileSettings = {
  export_format?: ExportFormat;
};

// Composite types for UI
export type TilWithTags = Til & {
  tags: Tag[];
};

// Insert types
export type TilInsert = Database["public"]["Tables"]["tils"]["Insert"];
export type TagInsert = Database["public"]["Tables"]["tags"]["Insert"];
