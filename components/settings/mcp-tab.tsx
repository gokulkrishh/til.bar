"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { generateApiKey, hasApiKey } from "@/app/actions/account";
import { toast } from "sonner";
import { Check, Copy, RefreshCw } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MCP_TOOLS } from "@/lib/mcp-tools";

const MCP_URL = "https://til.bar/api/mcp";

export function McpTab() {
  const [isPending, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [keyExists, setKeyExists] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);

  const checkApiKey = useCallback(async () => {
    setKeyLoading(true);
    const result = await hasApiKey();
    if (!result.error) {
      setKeyExists(result.exists ?? false);
    }
    setKeyLoading(false);
  }, []);

  useEffect(() => {
    checkApiKey();
    setNewKey(null);
    setConfirmRegenerate(false);
  }, [checkApiKey]);

  const handleCopyMcpUrl = async () => {
    await navigator.clipboard.writeText(MCP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
        toast.success(
          keyExists
            ? "New API key created — previous key revoked"
            : "API key created",
        );
      }
    });
  };

  return (
    <div className="flex flex-col gap-4 py-4 px-1">
      <div>
        <h3 className="text-sm font-medium">MCP Server</h3>
        <p className="text-xs text-muted-foreground">
          Connect AI assistants like Claude or ChatGPT.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 rounded-md bg-muted px-3 py-2.5 text-xs font-mono truncate">
          {MCP_URL}
        </code>
        <Button
          variant="outline"
          size="icon"
          aria-label="Copy server URL"
          onClick={handleCopyMcpUrl}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <div>
        <h3 className="text-sm font-medium">How to connect</h3>
        <ol className="mt-1.5 list-decimal list-inside space-y-1 text-xs text-muted-foreground">
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
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium">API Key</h3>
            <p className="text-xs text-muted-foreground">
              Required for AI connectors like Claude.ai
            </p>
          </div>
          {keyLoading ? (
            <Spinner className="size-4" />
          ) : (
            <Button
              variant={confirmRegenerate ? "destructive" : "outline"}
              size="sm"
              disabled={isPending}
              onClick={handleGenerateKey}
            >
              {confirmRegenerate ? (
                "Revoke and create new?"
              ) : keyExists ? (
                <>
                  <RefreshCw className="size-3.5" />
                  Regenerate
                </>
              ) : (
                "Create API key"
              )}
            </Button>
          )}
        </div>
        <div className="flex flex-col gap-4">
          {keyExists && !newKey && (
            <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2.5">
              <code className="text-xs font-mono text-muted-foreground">
                mcp_sk_••••••••
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
                <code className="flex-1 rounded-md bg-muted px-3 py-2.5 text-muted-foreground text-xs font-mono truncate">
                  {`${MCP_URL}?api_key=${newKey}`}
                </code>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Copy API key URL"
                  onClick={async () => {
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
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead className="w-30">Tool</TableHead>
            <TableHead>Description</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {MCP_TOOLS.map((tool, index) => (
            <TableRow key={tool.name}>
              <TableCell className="font-mono text-xs">{index + 1}</TableCell>
              <TableCell className="font-mono text-xs">{tool.name}</TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {tool.description}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
