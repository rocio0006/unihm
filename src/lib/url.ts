/** Only http(s) links are safe to render as a clickable `href` — blocks
 * `javascript:`/`data:`/etc. URIs that a delegate could otherwise store in
 * a task's links and have executed when another delegate or admin (an
 * authenticated, higher-value target) opens the task. */
export function isSafeHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}
