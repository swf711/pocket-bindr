/** 讀取檔案為 <img>，供 Canvas 裁切/縮放使用。 */
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

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('CANVAS_EXPORT_FAILED'))),
      'image/webp',
      quality,
    )
  })
}

/** 中心正方裁切 + 縮放至 outputSize x outputSize + 輸出 webp Blob（頭像用）。 */
export async function cropAndCompress(file: File, outputSize: number): Promise<Blob> {
  const img = await loadImage(file)
  const size = Math.min(img.width, img.height)
  const sx = (img.width - size) / 2
  const sy = (img.height - size) / 2

  const canvas = document.createElement('canvas')
  canvas.width = outputSize
  canvas.height = outputSize
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE')
  ctx.drawImage(img, sx, sy, size, size, 0, 0, outputSize, outputSize)

  return canvasToBlob(canvas, 0.9)
}

/** 等比縮放（長邊不超過 maxDimension，短邊不裁切）+ 輸出 webp Blob（回報附件用）。 */
export async function resizeAndCompress(file: File, maxDimension: number): Promise<Blob> {
  const img = await loadImage(file)
  const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
  const width = Math.round(img.width * scale)
  const height = Math.round(img.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('CANVAS_UNAVAILABLE')
  ctx.drawImage(img, 0, 0, width, height)

  return canvasToBlob(canvas, 0.8)
}
