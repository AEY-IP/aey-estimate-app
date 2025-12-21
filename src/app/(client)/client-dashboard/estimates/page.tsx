'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import EstimateDocumentManager from '@/components/EstimateDocumentManager';

interface ClientInfo {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  contractNumber?: string;
}

export default function ClientEstimatesPage() {
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadClientInfo();
  }, []);

  const loadClientInfo = async () => {
    try {
      const response = await fetch('/api/client/profile');
      if (response.ok) {
        const data = await response.json();
        setClientInfo(data.client);
      } else {
        console.error('Ошибка загрузки информации о клиенте');
        router.push('/client-login');
      }
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error);
      router.push('/client-login');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!clientInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center px-4">
          <p className="text-red-500 mb-4">Ошибка загрузки данных</p>
          <button
            onClick={() => router.push('/client-login')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Вернуться к входу
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Хлебные крошки */}
        <div className="flex items-center gap-2 mb-4 sm:mb-6">
          <button
            onClick={() => router.push('/client-dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm sm:text-base"
          >
            <ArrowLeft className="h-4 w-4" />
            Личный кабинет
          </button>
          <span className="text-gray-400">/</span>
          <span className="font-medium text-sm sm:text-base">Сметы</span>
        </div>

        {/* Заголовок */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 sm:gap-3">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            Сметы проекта
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
            <h2 className="font-semibold text-blue-900 mb-1 text-sm sm:text-base">
              {clientInfo.name}
            </h2>
            <div className="text-xs sm:text-sm text-blue-700 space-y-1">
              {clientInfo.phone && <p>📞 {clientInfo.phone}</p>}
              {clientInfo.email && <p>✉️ {clientInfo.email}</p>}
              {clientInfo.contractNumber && <p>📄 Договор: {clientInfo.contractNumber}</p>}
            </div>
          </div>
        </div>

        {/* Описание раздела */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2 text-sm sm:text-base">
            <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
            О ваших сметах
          </h3>
          <div className="text-xs sm:text-sm text-gray-600 space-y-2">
            <p>• Здесь размещены готовые сметы по вашему проекту</p>
            <p>• Вы можете просматривать и скачивать PDF файлы смет</p>
            <p>• Сметы разделены на основные и дополнительные работы</p>
            <p>• При появлении новых смет вы будете уведомлены</p>
          </div>
        </div>

        {/* Список смет */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
          <EstimateDocumentManager 
            clientId={clientInfo.id} 
            canUpload={false} 
          />
        </div>
      </div>
    </div>
  );
} 