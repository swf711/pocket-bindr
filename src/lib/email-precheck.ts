import { resolveMx } from 'node:dns/promises'
import { DISPOSABLE_EMAIL_DOMAINS } from '@/lib/disposable-domains.generated'

const MX_TIMEOUT_MS = 3000

function extractDomain(email: string): string | null {
  const domain = email.split('@')[1]
  return domain ? domain.toLowerCase() : null
}

export function isDisposableEmailDomain(email: string): boolean {
  const domain = extractDomain(email)
  if (!domain) return false
  return DISPOSABLE_EMAIL_DOMAINS.has(domain)
}

// D7：降噪用便宜預檢，不取代所有權驗證。DNS 逾時/查詢失敗一律 fail-open（不擋註冊），
// 只在查詢成功但確實查無 MX record 時才視為無效網域。
export async function hasValidMxRecord(email: string): Promise<boolean> {
  const domain = extractDomain(email)
  if (!domain) return true

  try {
    const records = await Promise.race([
      resolveMx(domain),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('MX_LOOKUP_TIMEOUT')), MX_TIMEOUT_MS)
      }),
    ])
    return records.length > 0
  } catch {
    return true
  }
}
