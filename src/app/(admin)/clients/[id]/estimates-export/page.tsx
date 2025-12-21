'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import EstimateDocumentManager from '@/components/EstimateDocumentManager';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  contractNumber?: string;
  notes?: string;
}

export default function ClientEstimatesExportPage({ params }: { params: { id: string } }) {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadClient();
  }, [params.id]);

  const loadClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`);
      if (response.ok) {
        const clientData = await response.json();
        setClient(clientData);
      } else {
        console.error('Ошибка загрузки клиента');
        router.push('/clients');
      }
    } catch (error) {
      console.error('Ошибка загрузки клиента:', error);
      router.push('/clients');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-red-500">Клиент не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Хлебные крошки */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => router.push(`/clients/${params.id}`)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Назад к клиенту
        </button>
        <span className="text-gray-400">/</span>
        <span className="font-medium">Сметы. Экспорт</span>
      </div>

      {/* Заголовок */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Сметы. Экспорт
        </h1>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h2 className="font-semibold text-blue-900 mb-1">
            {client.name}
          </h2>
          <div className="text-sm text-blue-700 space-y-1">
            {client.phone && <p>📞 {client.phone}</p>}
            {client.email && <p>✉️ {client.email}</p>}
            {client.contractNumber && <p>📄 Договор: {client.contractNumber}</p>}
          </div>
        </div>
      </div>

      {/* Описание раздела */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-900 mb-2">О разделе "Сметы. Экспорт"</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Здесь вы загружаете готовые PDF сметы для клиента</p>
          <p>• Клиент увидит эти сметы в своем кабинете в разделе "Сметы"</p>
          <p>• Укажите тип сметы: основная или дополнительные работы</p>
          <p>• Добавьте описание и примечания при необходимости</p>
        </div>
      </div>

      {/* Компонент управления PDF сметами */}
      <EstimateDocumentManager 
        clientId={params.id} 
        canUpload={true} 
      />
    </div>
  );
} 