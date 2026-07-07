import { Resend } from 'resend'
import type { ReportInput } from '@/lib/schemas/report'

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const REPORT_TYPE_LABELS: Record<ReportInput['type'], string> = {
  missing_card: '缺卡',
  data_error: '資料錯誤',
  bug: 'Bug',
  other: '其他',
}

function generateReportEmailHtml(params: {
  reporterEmail: string | null
  reporterId: string
  username: string | null
  type: ReportInput['type']
  message: string
  cardContext?: ReportInput['cardContext']
}): string {
  const { reporterEmail, reporterId, username, type, message, cardContext } = params
  const typeLabel = REPORT_TYPE_LABELS[type]

  const cardContextHtml = cardContext
    ? `<p style="margin:0 0 8px;font-size:14px;color:#09090b;line-height:1.6;">
        <strong>卡片：</strong>${escapeHtml(cardContext.cardName)}（${escapeHtml(cardContext.setExternalId)} ${escapeHtml(cardContext.cardNumber)}，id: ${escapeHtml(cardContext.cardId)}）
      </p>`
    : ''

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PocketBindr 使用者回報</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:40px 40px 24px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;">使用者回報：${escapeHtml(typeLabel)}</h1>
              <p style="margin:0 0 16px;font-size:13px;color:#71717a;line-height:1.6;">
                來自：${escapeHtml(username ?? '（無用戶名）')}（${escapeHtml(reporterEmail ?? '無 email')}，userId: ${escapeHtml(reporterId)}）
              </p>
              ${cardContextHtml}
              <p style="margin:16px 0 0;font-size:14px;color:#09090b;line-height:1.6;white-space:pre-wrap;">${escapeHtml(message)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendReportEmail(params: {
  reporterEmail: string | null
  reporterId: string
  username: string | null
  type: ReportInput['type']
  message: string
  cardContext?: ReportInput['cardContext']
}): Promise<void> {
  // In test environments, skip actual email sending
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'test') {
    return
  }

  const to = process.env.REPORT_TO_EMAIL
  if (!to) {
    throw new Error('缺少 REPORT_TO_EMAIL（請填 .env，見 .env.example）')
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'PocketBindr <noreply@send.pocketbindr.app>',
    to,
    subject: `[PocketBindr 回報] ${REPORT_TYPE_LABELS[params.type]}`,
    html: generateReportEmailHtml(params),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}

function generateResetEmailHtml(token: string, username?: string): string {
  const resetUrl = `${process.env.AUTH_URL}/reset-password?token=${encodeURIComponent(token)}`
  const greeting = username ? `您好，${username}` : '您好'

  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>重設您的密碼</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:8px;overflow:hidden;border:1px solid #e4e4e7;">
          <tr>
            <td style="padding:40px 40px 24px;">
              <h1 style="margin:0 0 8px;font-size:20px;font-weight:700;color:#09090b;">重設您的密碼</h1>
              <p style="margin:0 0 24px;font-size:14px;color:#71717a;line-height:1.6;">${greeting}，<br />我們收到了您的密碼重設請求。請在 15 分鐘內點擊下方按鈕完成重設。</p>
              <a href="${resetUrl}" style="display:inline-block;padding:10px 24px;background:#09090b;color:#ffffff;text-decoration:none;border-radius:6px;font-size:14px;font-weight:500;">重設密碼</a>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 40px 40px;">
              <hr style="border:none;border-top:1px solid #e4e4e7;margin:0 0 24px;" />
              <p style="margin:0 0 8px;font-size:12px;color:#a1a1aa;line-height:1.6;">若您並未申請重設密碼，請忽略此封信件，您的密碼不會有任何變更。</p>
              <p style="margin:0;font-size:12px;color:#a1a1aa;line-height:1.6;">或複製以下連結至瀏覽器：<br /><span style="color:#52525b;word-break:break-all;">${resetUrl}</span></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export async function sendResetPasswordEmail(
  to: string,
  token: string,
  username?: string,
): Promise<void> {
  // In test environments, skip actual email sending
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'test') {
    return
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'PocketBindr <noreply@send.pocketbindr.app>',
    to,
    subject: '重設您的 PocketBindr 密碼',
    html: generateResetEmailHtml(token, username),
  })

  if (error) {
    throw new Error(`Resend error: ${error.message}`)
  }
}
