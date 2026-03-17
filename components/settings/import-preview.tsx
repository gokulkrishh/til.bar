"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { X } from "lucide-react";
import { confirmImport } from "@/app/actions/import";
import { toast } from "sonner";
import type { ImportLink } from "@/lib/ai-import";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: "long",
  day: "numeric",
  year: "numeric",
});

export function ImportPreview({
  links,
  onClose,
}: {
  links: ImportLink[];
  onClose: () => void;
}) {
  const [isImporting, startImportTransition] = useTransition();

  const handleConfirmImport = () => {
    startImportTransition(async () => {
      const result = await confirmImport(links);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success(`Imported ${result.count} links`);
      onClose();
    });
  };

  return (
    <div className="flex flex-col gap-3 py-4 px-1">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          Preview ({links.length} links)
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          disabled={isImporting}
        >
          <X />
        </Button>
      </div>
      <div className="max-h-64 overflow-y-auto rounded-md border">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-background border-b">
            <tr>
              <th className="text-left p-2 font-medium">Title</th>
              <th className="text-left p-2 font-medium">Tags</th>
              <th className="text-left p-2 font-medium">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {links.map((link, i) => (
              <tr key={i}>
                <td className="p-2 max-w-48">
                  <div className="truncate">{link.title || "—"}</div>
                  <div className="truncate text-blue-700 text-[0.625rem]">
                    {link.url}
                  </div>
                </td>
                <td className="p-2">
                  {link.tags?.length ? (
                    <div className="flex flex-wrap gap-1">
                      {link.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-[0.625rem]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="p-2 text-muted-foreground whitespace-nowrap">
                  {link.created_at
                    ? dateFormatter.format(new Date(link.created_at))
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onClose} disabled={isImporting}>
          Cancel
        </Button>
        <Button onClick={handleConfirmImport} disabled={isImporting}>
          {isImporting ? <Spinner /> : null}
          Import {links.length} links
        </Button>
      </div>
    </div>
  );
}
