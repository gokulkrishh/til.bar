"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateApiKey, hasApiKey } from "@/app/actions/account";
import { toast } from "sonner";
import { Check, Chrome, Copy, RefreshCw } from "lucide-react";
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
  "https://chromewebstore.google.com/detail/tilbar/gbicabbfdiljmpcoemmejcibpmgichgp";

export function IntegrationsTab() {
  const [isPending, startTransition] = useTransition();
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyExists, setKeyExists] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const [playClick] = useAppSound(clickSoftSound);
  const trigger = useAppHaptics();

  useEffect(() => {
    let cancelled = false;
    async function init() {
      setKeyLoading(true);
      const result = await hasApiKey();
      if (!cancelled && !result.error) {
        setKeyExists(result.exists ?? false);
      }
      if (!cancelled) setKeyLoading(false);
    }
    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleGenerateKey = () => {
    if (keyExists && !confirmRegenerate) {
      setConfirmRegenerate(true);
      return;
    }

    setConfirmRegenerate(false);
    startTransition(async () => {
      const result = await generateApiKey();
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.key) {
        setNewKey(result.key);
        setKeyExists(true);
        toast.success("API key created");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 py-4 pl-1 pr-3">
      {/* API Key — shared across integrations */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center min-h-8 justify-between">
          <h3 className="text-sm font-semibold">API Key</h3>
        </div>
        {!newKey && (
          <div className="flex w-full justify-between gap-2">
            <div className="flex w-full justify-between items-center gap-2 rounded-md bg-muted px-3 py-2.5">
              <code className="text-xs font-mono text-foreground">
                mcp_sk_••••••••
              </code>
              {keyExists && <Check className="size-4 text-green-700" />}
            </div>
            <Button
              variant={confirmRegenerate ? "destructive" : "secondary"}
              disabled={isPending || keyLoading}
              onClick={handleGenerateKey}
            >
              {isPending ? (
                <>
                  <Spinner /> Regenerate
                </>
              ) : confirmRegenerate ? (
                "Revoke and create new?"
              ) : keyExists || keyLoading ? (
                <>
                  <RefreshCw />
                  Regenerate
                </>
              ) : (
                "Create API key"
              )}
            </Button>
          </div>
        )}
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
