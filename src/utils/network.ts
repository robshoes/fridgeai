// Best-effort detection of "no connectivity" vs. other failures, based on
// the errors React Native's fetch typically throws when offline. Good
// enough for a clear error message (PRD Fase 3 minimum); a full
// connectivity-aware experience across every screen is built in Fase 6.
export function isNetworkError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }
  return /network request failed|failed to fetch/i.test(error.message);
}
