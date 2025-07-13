'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ActEditPage() {
  const params = useParams()
  const router = useRouter()
  const actId = params.id as string

  useEffect(() => {
    // Перенаправляем на редактирование сметы с пометкой что это акт
    const returnUrl = encodeURIComponent(`/acts/${actId}`)
    router.replace(`/estimates/${actId}/edit?isAct=true&returnTo=${returnUrl}`)
  }, [actId, router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Перенаправление на редактирование акта...</p>
      </div>
    </div>
  )
} 