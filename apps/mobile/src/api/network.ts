/** Expo's native fetch rejects with an Error, whereas browser/RN fetch often uses TypeError. */
export function isNetworkError(error: unknown, signal?: Pick<AbortSignal, 'aborted'>): boolean {
  const seen = new Set<unknown>();
  let current = error;
  while (current != null && !seen.has(current)) {
    seen.add(current);
    const detail = typeof current === 'object' ? current as Record<string, unknown> : {};
    // An HTTP response is an application/server error, not a disconnected transport.
    if (typeof detail.status === 'number' && detail.status >= 100 && detail.status <= 599) return false;
    const message = typeof current === 'string' ? current : String(detail.message ?? '');
    if (detail.name === 'AbortError' || detail.name === 'FetchError' ||
      /^(fetch failed(?::|$)|failed to fetch\b|network request failed\b|load failed$)/i.test(message) ||
      /networkerror when attempting to fetch|could not connect to the server|internet connection appears to be offline|network connection was lost|server with the specified hostname could not be found/i.test(message) ||
      /^(ECONNREFUSED|ECONNRESET|ENETUNREACH|EHOSTUNREACH|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|ERR_NETWORK|ERR_INTERNET_DISCONNECTED)$/.test(String(detail.code ?? ''))) return true;
    current = detail.cause;
  }
  return signal?.aborted === true;
}
