'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useTranslations } from 'next-intl'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Item, ItemMedia, ItemContent, ItemTitle, ItemActions } from '@/components/ui/item'
import { cropAndCompress } from '@/lib/image-compress'

const AVATAR_OUTPUT_SIZE = 256

interface AvatarFormProps {
  username: string
  image: string | null
}

export function AvatarForm({ username, image }: AvatarFormProps) {
  const t = useTranslations('settings.avatar')
  const { update } = useSession()
  const router = useRouter()
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
      const blob = await cropAndCompress(file, AVATAR_OUTPUT_SIZE)
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
      router.refresh()
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
      router.refresh()
      toast(t('removeSuccess'))
    } catch {
      toast.error(t('removeFailed'))
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Item variant="outline">
      <ItemMedia>
        <Avatar className="size-16">
          <AvatarImage src={currentImage ?? undefined} alt={username} />
          <AvatarFallback className="bg-tertiary-container text-on-tertiary-container text-xl">
            {initial}
          </AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent>
        <ItemTitle>{username}</ItemTitle>
      </ItemContent>
      <ItemActions>
        <Button
          type="button"
          size="sm"
          variant="tertiary"
          disabled={isUploading}
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? t('uploading') : t('upload')}
        </Button>
        {currentImage && (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={isRemoving}
            onClick={handleRemove}
          >
            {isRemoving ? t('removing') : t('remove')}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          data-testid="avatar-file-input"
          onChange={handleFileChange}
        />
      </ItemActions>
    </Item>
  )
}
