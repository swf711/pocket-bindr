// Data hooks throw ClientError carrying a stable code (not human text), so
// consumers translate via t(code). This avoids surfacing raw API error text
// (which is English, e.g. 'Internal server error') or hardcoded strings that
// ignore the active UI locale.
export type ClientErrorCode =
  | 'LOAD_FAILED'
  | 'ADD_FAILED'
  | 'BATCH_ADD_FAILED'
  | 'BATCH_CAPACITY_EXCEEDED'
  | 'BATCH_RATE_LIMITED'

export class ClientError extends Error {
  constructor(public readonly code: ClientErrorCode) {
    super(code)
    this.name = 'ClientError'
  }
}
