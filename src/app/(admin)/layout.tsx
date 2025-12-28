import Navigation from '@/components/Navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    </>
  )
}


