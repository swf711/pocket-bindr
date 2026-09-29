import { createHash } from 'node:crypto'
import { redis } from '@/lib/redis'

/**
 * Server error alerting (Discord webhook), fed by instrumentation.ts `onRequestError`.
 *
 * Privacy: the payload only carries the route *pattern* (`/[locale]/b/[token]`, never the real
 * URL — share and verification tokens live in paths and query strings), the HTTP method, the
 * error class name, and the first line of the message. No headers, cookies, query strings,
 * bodies, or stack traces are ever sent.
 */

export interface ServerErrorInput {
  name: string
  message: string
  digest?: string
  method: string
  routePath: string
  routeType: string
}

const THROTTLE_SECONDS = 600
const MAX_MESSAGE_LENGTH = 200
const MAX_CONTENT_LENGTH = 1800
const WEBHOOK_TIMEOUT_MS = 3000

/** Same error on the same route only alerts once per throttle window. */
export function throttleKey(input: Pick<ServerErrorInput, 'name' | 'message' | 'routePath'>): string {
  const fingerprint = createHash('sha1')
    .update(`${input.routePath}\n${input.name}\n${firstLine(input.message)}`)
    .digest('hex')
    .slice(0, 16)
  return `err-alert:${fingerprint}`
}

function firstLine(message: string): string {
  return message.split('\n')[0].slice(0, MAX_MESSAGE_LENGTH)
}

export function buildAlertContent(input: ServerErrorInput): string {
  const lines = [
    `🚨 **Server error** on \`${input.method} ${input.routePath}\` (${input.routeType})`,
    `\`${input.name}\`: ${firstLine(input.message)}`,
    input.digest ? `digest: \`${input.digest}\`` : null,
  ].filter((line): line is string => line !== null)
  return lines.join('\n').slice(0, MAX_CONTENT_LENGTH)
}

export function isAlertingEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return env.VERCEL_ENV === 'production' && Boolean(env.ERROR_ALERT_WEBHOOK_URL)
}

/** Never throws: alerting must not be able to break (or slow down) the request that failed. */
export async function reportServerError(input: ServerErrorInput): Promise<void> {
  try {
    if (!isAlertingEnabled()) return
    const url = process.env.ERROR_ALERT_WEBHOOK_URL as string

    const acquired = await redis.set(throttleKey(input), '1', { nx: true, ex: THROTTLE_SECONDS })
    if (!acquired) return

    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: buildAlertContent(input) }),
      signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS),
    })
  } catch (err) {
    console.error('[error-alert] failed to report', err instanceof Error ? err.name : 'unknown')
  }
}
