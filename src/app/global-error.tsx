'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="zh-TW">
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '1.5rem',
          textAlign: 'center',
          padding: '1rem',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>發生未預期的錯誤</h1>
          <p style={{ color: '#666' }}>系統暫時發生問題，請稍後再試。</p>
        </div>
        <button
          onClick={reset}
          style={{
            padding: '0.5rem 1.5rem',
            borderRadius: '9999px',
            background: '#045387',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            fontSize: '1rem',
          }}
        >
          重試
        </button>
      </body>
    </html>
  )
}
