"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  generateApiKey,
  listApiKeys,
  deleteApiKey,
} from "@/app/actions/account";
import { toast } from "sonner";
import { Check, Chrome, Copy, Plus, Trash2 } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { MCP_TOOLS } from "@/lib/mcp-tools";
import { clickSoftSound } from "@/sounds/click-soft";
import { useAppSound } from "@/hooks/use-app-sound";
import { useAppHaptics } from "@/context/haptics-provider";
import { ShortcutIcon } from "../icons/shortcut";

const MCP_URL = "https://til.bar/api/mcp";

const IOS_SHORTCUT_URL =
  "https://www.icloud.com/shortcuts/7c183f258862457bb639ca1ee537d277";

const CHROME_EXTENSION_URL =
  "https://chromewebstore.google.com/detail/tilbar/afmgmolhlebpekeinagokegpghkaegpi";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

type ApiKey = { id: string; label: string; created_at: string };

export function IntegrationsTab() {
  const [isCreating, startCreateTransition] = useTransition();
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [keysLoading, setKeysLoading] = useState(true);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [label, setLabel] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [playClick] = useAppSound(clickSoftSound);
  const trigger = useAppHaptics();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setKeysLoading(true);
      const result = await listApiKeys();
      if (!cancelled && !result.error) {
        setKeys(result.keys ?? []);
      }
      if (!cancelled) setKeysLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCreateKey = () => {
    if (!label.trim()) {
      toast.error("Enter a name for this key");
      return;
    }

    startCreateTransition(async () => {
      const result = await generateApiKey(label.trim());
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.key) {
        setNewKey(result.key);
        setLabel("");
        setShowCreate(false);
        toast.success("API key created");
        const refreshed = await listApiKeys();
        if (!refreshed.error) {
          setKeys(refreshed.keys ?? []);
        }
      }
    });
  };

  const handleRevoke = async (keyId: string) => {
    if (revokingId !== keyId) {
      setRevokingId(keyId);
      return;
    }

    setIsDeletingId(keyId);
    const result = await deleteApiKey(keyId);
    if (result.error) {
      toast.error(result.error);
      setIsDeletingId(null);
      return;
    }
    setRevokingId(null);
    setIsDeletingId(null);
    setKeys((prev) => prev.filter((k) => k.id !== keyId));
    toast.success("API key revoked");
  };

  return (
    <div className="flex flex-col gap-6 py-4 pl-1 pr-3">
      {/* API Keys */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center min-h-8 justify-between">
          <h3 className="text-sm font-semibold">API Keys</h3>
          {!showCreate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowCreate(true);
                setNewKey(null);
              }}
            >
              <Plus className="size-3.5" />
              Create key
            </Button>
          )}
        </div>

        {/* Create form */}
        {showCreate && (
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. Chrome Extension, MCP, iOS Shortcut"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateKey();
                if (e.key === "Escape") {
                  setShowCreate(false);
                  setLabel("");
                }
              }}
              autoFocus
              className="flex-1 rounded-md bg-muted px-3 py-2 text-sm outline-none placeholder:text-muted-foreground"
            />
            <Button
              variant="secondary"
              disabled={isCreating}
              onClick={handleCreateKey}
            >
              {isCreating ? <Spinner /> : null} Create
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setShowCreate(false);
                setLabel("");
              }}
            >
              Cancel
            </Button>
          </div>
        )}

        {/* Newly created key */}
        {newKey && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-2">
              Save this key now — you won&apos;t see it again
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2.5 text-xs font-mono truncate">
                {newKey}
              </code>
              <Button
                variant="secondary"
                size="icon"
                aria-label="Copy API key"
                onClick={async () => {
                  playClick();
                  trigger("light");
                  await navigator.clipboard.writeText(newKey);
                  setKeyCopied(true);
                  toast.success("Copied");
                  setTimeout(() => setKeyCopied(false), 2000);
                }}
              >
                {keyCopied ? <Check /> : <Copy />}
              </Button>
            </div>
          </div>
        )}

        {/* Key list */}
        {keysLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
            <Spinner /> Loading keys…
          </div>
        ) : keys.length === 0 ? (
          <p className="text-sm text-muted-foreground py-2">
            No API keys yet. Create one to use integrations.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between gap-3 rounded-md bg-muted px-3 py-2.5"
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-sm font-medium truncate">
                    {key.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Created {dateFormatter.format(new Date(key.created_at))}
                  </span>
                </div>
                <Button
                  variant="destructive"
                  size={revokingId === key.id ? "sm" : "default"}
                  disabled={isDeletingId === key.id}
                  onClick={() => handleRevoke(key.id)}
                  onBlur={() => {
                    if (revokingId === key.id) setRevokingId(null);
                  }}
                >
                  {revokingId === key.id ? (
                    isDeletingId === key.id ? (
                      <Spinner />
                    ) : (
                      "Revoke?"
                    )
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border" />

      {/* MCP Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Model Context Protocol (MCP)</h3>
        <ol className="list-decimal list-inside space-y-1 px-2 text-sm text-foreground">
          <li>Create an API key above.</li>
          <li>Copy the server URL below with your key.</li>
          <li>
            Add it in{" "}
            <span className="font-medium text-foreground">
              Claude.ai &rarr; Settings &rarr; Connectors
            </span>{" "}
            or your MCP client config.
          </li>
        </ol>
        <div className="rounded-md bg-muted px-3 py-2.5">
          <code className="text-xs font-mono text-foreground break-all">
            {MCP_URL}?api_key={"<your-api-key>"}
          </code>
        </div>
        <div className="flex flex-col gap-3">
          <h4 className="text-xs font-medium text-foreground">
            Available tools
          </h4>
          <div className="flex flex-wrap gap-2">
            {MCP_TOOLS.map((tool) => (
              <code
                key={tool.name}
                className="rounded-md bg-muted px-2 py-1 text-xs font-mono text-foreground"
                title={tool.description}
              >
                {tool.name}
              </code>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-border" />

      {/* Chrome Extension Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">Chrome Extension</h3>
        <p className="text-sm text-foreground">
          Save any page or link with one click.
        </p>
        <a
          tabIndex={-1}
          className="self-end"
          href={CHROME_EXTENSION_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary">
            <Chrome />
            Get extension
          </Button>
        </a>
      </div>

      <div className="border-t border-border" />

      {/* iOS Shortcut Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">iOS Shortcut</h3>
        <p className="text-sm text-foreground">
          Save links from any app via the Share Sheet.
        </p>
        <ol className="list-decimal list-inside space-y-1 px-2 text-sm text-foreground">
          <li>Create an API key above.</li>
          <li>Add the shortcut using the button below.</li>
          <li>
            Open the shortcut, find the{" "}
            <span className="font-medium text-foreground">Authorization</span>{" "}
            header and replace the API key with yours:{" "}
            <code className="text-xs font-medium font-mono text-foreground">
              Bearer mcp_sk_…
            </code>
          </li>
        </ol>
        <a
          tabIndex={-1}
          className="self-end"
          href={IOS_SHORTCUT_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button variant="secondary">
            <ShortcutIcon />
            Get shortcut
          </Button>
        </a>
      </div>
    </div>
  );
}
