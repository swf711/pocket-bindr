'use client'

import { useRef, useState } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

const AVATAR_OUTPUT_SIZE = 256

interface AvatarFormProps {
  username: string
  image: string | null
}

/** 讀取檔案為 <img>，供 Canvas 裁切使用。 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('IMAGE_LOAD_FAILED'))
    }
    img.src = url
  })
}

/** 中心正方裁切 + 縮放至 256x256 + 輸出 webp Blob。 */
async function cropAndCompress(file: File): Promise<Blob> {
  const img = await loadImage(file)
  const size = Math.min(img.width, img.height)
  const sx = (img.width - size) / 2
  const sy = (img.height - size) / 2

  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_OUTPUT_SIZE
  canvas.height = AVATAR_OUTPUT_SIZE
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE')
  ctx.drawImage(img, sx, sy, size, size, 0, 0, AVATAR_OUTPUT_SIZE, AVATAR_OUTPUT_SIZE)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('CANVAS_EXPORT_FAILED'))),
      'image/webp',
      0.9,
    )
  })
}

export function AvatarForm({ username, image }: AvatarFormProps) {
  const t = useTranslations('settings.avatar')
  const { update } = useSession()
  const [currentImage, setCurrentImage] = useState(image)
  const [isUploading, setIsUploading] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initial = username.charAt(0).toUpperCase()

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    setIsUploading(true)
    try {
      const blob = await cropAndCompress(file)
      const formData = new FormData()
      formData.append('file', blob, 'avatar.webp')

      const res = await fetch('/api/user/avatar', { method: 'POST', body: formData })
      if (!res.ok) {
        toast.error(t('uploadFailed'))
        return
      }
      const data = await res.json()
      setCurrentImage(data.image)
      await update({ image: data.image })
      toast(t('uploadSuccess'))
    } catch {
      toast.error(t('uploadFailed'))
    } finally {
      setIsUploading(false)
    }
  }

  async function handleRemove() {
    setIsRemoving(true)
    try {
      const res = await fetch('/api/user/avatar', { method: 'DELETE' })
      if (!res.ok) {
        toast.error(t('removeFailed'))
        return
      }
      setCurrentImage(null)
      await update({ image: null })
      toast(t('removeSuccess'))
    } catch {
      toast.error(t('removeFailed'))
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-16">
        {currentImage && <AvatarImage src={currentImage} alt={username} />}
        <AvatarFallback className="bg-tertiary-container text-on-tertiary-container text-xl">
          {initial}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? t('uploading') : t('upload')}
          </Button>
          {currentImage && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={isRemoving}
              onClick={handleRemove}
            >
              {isRemoving ? t('removing') : t('remove')}
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          data-testid="avatar-file-input"
          onChange={handleFileChange}
        />
      </div>
    </div>
  )
}
