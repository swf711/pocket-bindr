import type { Instrumentation } from 'next'

// Runs on every unhandled server error (render, route handler, server action). The alert is
// handed to waitUntil so it can finish after the response without adding latency; the import is
// dynamic so the Redis client is only loaded when an error actually happens.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  // node:crypto and the Redis client are Node-only; the edge runtime is not used by this app.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { waitUntil } = await import('@vercel/functions')
  const { reportServerError } = await import('@/lib/error-alert')

  const err = error as { name?: string; message?: string; digest?: string } | undefined
  waitUntil(
    reportServerError({
      name: err?.name ?? 'Error',
      message: err?.message ?? String(error),
      digest: err?.digest,
      method: request.method,
      routePath: context.routePath,
      routeType: context.routeType,
    }),
  )
}
