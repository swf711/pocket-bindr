export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 flex-1">
      {children}
    </div>
  )
}
