/** Runtime configuration. Every external service falls back to a mock when its key is missing. */
export type Config = ReturnType<typeof loadConfig>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  return {
    port: Number(env.PORT ?? 8787),
    dataPath: env.DATA_PATH ?? 'server/.data/esbot.db',
    appUrl: env.APP_URL ?? 'http://localhost:5173',
    accountId: env.ACCOUNT_ID ?? 'acc_earth',
    /** Bearer token for the single owner until the ES Account adapter lands. */
    authToken: env.AUTH_TOKEN ?? 'dev-token',
    ownerId: env.OWNER_ID ?? 'user:earth',
    masterKey: env.MASTER_KEY ?? 'dev-only-master-key-change-me',
    budgetPerRun: Number(env.BUDGET_PER_RUN ?? 50),
    budgetPerDay: Number(env.BUDGET_PER_DAY ?? 300),
    blastThreshold: Number(env.BLAST_THRESHOLD ?? 20),
    rateLimitPerMinute: Number(env.RATE_LIMIT_PER_MINUTE ?? 120),
    line: env.LINE_CHANNEL_TOKEN && env.LINE_USER_ID ? { token: env.LINE_CHANNEL_TOKEN, userId: env.LINE_USER_ID } : undefined,
    model: env.MODEL_API_KEY
      ? { baseUrl: env.MODEL_BASE_URL ?? 'https://openrouter.ai/api/v1', apiKey: env.MODEL_API_KEY, name: env.MODEL_NAME ?? 'anthropic/claude-sonnet-5.5' }
      : undefined,
    /** Real MCP servers for the MVP connectors; unset → builtin mock. */
    mcp: {
      'google-sheets': env.GOOGLE_SHEETS_MCP_URL ? { url: env.GOOGLE_SHEETS_MCP_URL, secret: env.GOOGLE_SHEETS_MCP_TOKEN } : undefined,
      'es-account': env.ES_ACCOUNT_MCP_URL ? { url: env.ES_ACCOUNT_MCP_URL, secret: env.ES_ACCOUNT_MCP_TOKEN } : undefined,
      'line-oa': env.LINE_OA_MCP_URL ? { url: env.LINE_OA_MCP_URL, secret: env.LINE_OA_MCP_TOKEN } : undefined,
    } as Record<string, { url: string; secret?: string } | undefined>,
  };
}
