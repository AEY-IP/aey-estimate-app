'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function EstimatesPage() {
  const router = useRouter()

  // Немедленно перенаправляем на страницу клиентов
  useEffect(() => {
    router.push('/clients')
  }, [router])

  return null
} 