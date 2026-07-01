// Data hooks throw ClientError carrying a stable code (not human text), so
// consumers translate via t(code). This avoids surfacing raw API error text
// (which is English, e.g. 'Internal server error') or hardcoded strings that
// ignore the active UI locale.
export type ClientErrorCode = 'LOAD_FAILED' | 'ADD_FAILED'

export class ClientError extends Error {
  constructor(public readonly code: ClientErrorCode) {
    super(code)
    this.name = 'ClientError'
  }
}
