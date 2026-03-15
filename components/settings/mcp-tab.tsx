"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateApiKey, hasApiKey } from "@/app/actions/account";
import { toast } from "sonner";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { MCP_TOOLS } from "@/lib/mcp-tools";
import { clickSoftSound } from "@/sounds/click-soft";
import { useAppSound } from "@/hooks/use-app-sound";
import { useAppHaptics } from "@/context/haptics-provider";

const MCP_URL = "https://til.bar/api/mcp";

export function McpTab() {
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
      console.log(result);
      if (result.key) {
        setNewKey(result.key);
        setKeyExists(true);
        toast.success("New API key created");
      }
    });
  };

  return (
    <div className="flex flex-col gap-5 py-4 px-1">
      {/* Server URL */}
      <div className="flex flex-col gap-2">
        <h4 className="text-sm font-semibold">MCP Instructions</h4>
        <ol className="list-decimal list-inside space-y-1 px-2 text-sm text-muted-foreground">
          <li>Create an API key below</li>
          <li>Copy the URL with your key</li>
          <li>
            Add it in{" "}
            <span className="font-medium text-foreground">
              Claude.ai &rarr; Settings &rarr; Connectors
            </span>{" "}
            or your MCP client config
          </li>
        </ol>
      </div>

      {/* API Key */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center min-h-8 justify-between">
          <h3 className="text-sm font-semibold">API Key</h3>
          <Button
            variant={confirmRegenerate ? "destructive" : "outline"}
            size="sm"
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
        {!newKey && (
          <div className="flex w-full justify-between items-center gap-2 rounded-md bg-muted px-3 py-2.5">
            <code className="text-xs font-mono text-foreground">
              https://til.bar/api/mcp?api_key=mcp_sk_••••••••
            </code>
            <Check className="size-3 text-green-500" />
          </div>
        )}
        {newKey && (
          <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3">
            <p className="text-xs font-medium text-yellow-700 dark:text-yellow-400 mb-2">
              Copy this URL — it&apos;s only shown once
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted px-3 py-2.5 text-xs font-mono truncate">
                {`${MCP_URL}?api_key=${newKey}`}
              </code>
              <Button
                variant="outline"
                size="icon"
                aria-label="Copy API key URL"
                onClick={async () => {
                  playClick();
                  trigger("light");
                  await navigator.clipboard.writeText(
                    `${MCP_URL}?api_key=${newKey}`,
                  );
                  setKeyCopied(true);
                  toast.success("Copied to clipboard");
                  setTimeout(() => setKeyCopied(false), 2000);
                }}
              >
                {keyCopied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Tools — compact list */}
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">Available tools</h3>
        <div className="flex flex-wrap gap-1.5">
          {MCP_TOOLS.map((tool) => (
            <code
              key={tool.name}
              className="rounded-md bg-muted px-2 py-1 text-xs font-mono text-muted-foreground"
              title={tool.description}
            >
              {tool.name}
            </code>
          ))}
        </div>
      </div>
    </div>
  );
}
