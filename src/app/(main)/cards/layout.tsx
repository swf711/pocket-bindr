/**
 * Parallel + Intercepting Routes：{children} = /cards 列表（page.tsx），{modal} = @modal slot。
 * 直接訪問 /cards/{game}/{language}/{externalId}（含重整）→ @modal 落到 default.tsx（null），
 * 真實頁由 [game]/[language]/[externalId]/page.tsx 全頁渲染；從列表點卡（soft nav）→
 * @modal 攔截為 (.)[game]/[language]/[externalId]/page.tsx，列表維持在背景。
 */
export default function CardsLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
