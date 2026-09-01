interface WebMCPAnnotations {
  readOnlyHint?: boolean;
  untrustedContentHint?: boolean;
}

interface WebMCPTool {
  name: string;
  description: string;
  inputSchema?: object;
  annotations?: WebMCPAnnotations;
  execute: (
    input: Record<string, unknown>,
    options?: { signal?: AbortSignal },
  ) => unknown | Promise<unknown>;
}

interface ModelContext {
  registerTool(
    tool: WebMCPTool,
    options?: { signal?: AbortSignal },
  ): Promise<void>;
}

interface Document {
  readonly modelContext?: ModelContext;
}
