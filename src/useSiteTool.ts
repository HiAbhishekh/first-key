import { useEffect, useRef, useState } from "react";

export type SiteToolConfig = {
  name: string;
  description: string;
  inputSchema: object;
  annotations?: {
    readOnlyHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute: (input: Record<string, unknown>) => unknown | Promise<unknown>;
  enabled?: boolean;
};

/**
 * Registers a tool with the page's model context and unregisters on unmount.
 * Pattern: Chrome use-webmcp-tool (document.modelContext.registerTool + AbortSignal).
 * ChatGPT Site tools only see top-level JS registration — not HTML forms, not iframes.
 */
export function useSiteTool(config: SiteToolConfig): {
  supported: boolean;
  registered: boolean;
} {
  const [supported, setSupported] = useState(false);
  const [registered, setRegistered] = useState(false);
  const executeRef = useRef(config.execute);
  executeRef.current = config.execute;
  const enabled = config.enabled !== false;

  useEffect(() => {
    const ctx = document.modelContext;
    const can = typeof ctx?.registerTool === "function";
    setSupported(can);
    if (!can || !enabled || !ctx) {
      setRegistered(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    ctx
      .registerTool(
        {
          name: config.name,
          description: config.description,
          inputSchema: config.inputSchema,
          annotations: config.annotations,
          execute: async (input) => executeRef.current(input),
        },
        { signal: controller.signal },
      )
      .then(() => {
        if (!cancelled) setRegistered(true);
      })
      .catch(() => {
        if (!cancelled) setRegistered(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
      setRegistered(false);
    };
  }, [
    config.name,
    config.description,
    enabled,
    config.annotations?.readOnlyHint,
    config.annotations?.untrustedContentHint,
  ]);

  return { supported, registered };
}
