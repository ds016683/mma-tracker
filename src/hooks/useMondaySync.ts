// Monday sync disabled — project data now sourced from Notion via Supabase
export function useMondaySync(_refetch: () => Promise<void>) {
  // No-op: sync now handled by VPS notion-sync-daemon writing to Supabase
}
