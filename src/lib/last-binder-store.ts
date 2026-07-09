// 當頁 session 記憶「上次成功加入的卡冊」；module 級變數，硬重整歸零，不落地 storage。
let lastAddedBinderId: string | null = null

export function getLastAddedBinderId() {
  return lastAddedBinderId
}

export function setLastAddedBinderId(id: string) {
  lastAddedBinderId = id
}
