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
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!clientInfo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-500">Ошибка загрузки данных</p>
            <button
              onClick={() => router.push('/client-login')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Вернуться к входу
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Хлебные крошки */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => router.push('/client-dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Личный кабинет
          </button>
          <span className="text-gray-400">/</span>
          <span className="font-medium">Сметы</span>
        </div>

        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <FileText className="h-6 w-6 text-blue-600" />
            Сметы проекта
          </h1>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h2 className="font-semibold text-blue-900 mb-1">
              {clientInfo.name}
            </h2>
            <div className="text-sm text-blue-700 space-y-1">
              {clientInfo.phone && <p>📞 {clientInfo.phone}</p>}
              {clientInfo.email && <p>✉️ {clientInfo.email}</p>}
              {clientInfo.contractNumber && <p>📄 Договор: {clientInfo.contractNumber}</p>}
            </div>
          </div>
        </div>

        {/* Описание раздела */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-500" />
            О ваших сметах
          </h3>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• Здесь размещены готовые сметы по вашему проекту</p>
            <p>• Вы можете просматривать и скачивать PDF файлы смет</p>
            <p>• Сметы разделены на основные и дополнительные работы</p>
            <p>• При появлении новых смет вы будете уведомлены</p>
          </div>
        </div>

        {/* Список смет */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <EstimateDocumentManager 
            clientId={clientInfo.id} 
            canUpload={false} 
          />
        </div>
      </div>
    </div>
  );
} 