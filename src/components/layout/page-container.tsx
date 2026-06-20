export function PageContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="container mx-auto px-4 py-6 flex-1">
      {children}
    </div>
  )
}
