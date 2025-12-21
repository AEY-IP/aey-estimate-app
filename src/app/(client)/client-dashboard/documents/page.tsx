'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import DocumentManager from '@/components/DocumentManager';

interface ClientData {
  client: {
    id: string;
    name: string;
  };
  user: {
    id: string;
    name: string;
    username: string;
    role: string;
  };
  isAuthenticated: boolean;
}

export default function ClientDocumentsPage() {
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const loadClientInfo = async () => {
      try {
        const response = await fetch('/api/auth/client-me');
        if (response.ok) {
          const data = await response.json();
          setClientData(data);
        } else {
          router.push('/client-login');
        }
      } catch (error) {
        console.error('Ошибка загрузки информации клиента:', error);
        router.push('/client-login');
      } finally {
        setLoading(false);
      }
    };

    loadClientInfo();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!clientData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center py-12">
          <p className="text-red-600 text-lg">Ошибка загрузки данных клиента</p>
          <Link 
            href="/client-dashboard" 
            className="mt-4 inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Вернуться в главное меню
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          {/* Back Button */}
          <div className="mb-4 sm:mb-6">
            <Link 
              href="/client-dashboard"
              className="inline-flex items-center px-3 sm:px-4 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors group text-sm sm:text-base"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Вернуться в главное меню
            </Link>
          </div>

          {/* Title Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Документы проекта</h1>
                  <p className="text-sm sm:text-base text-gray-600">Проект: {clientData.client.name}</p>
                </div>
              </div>
              <p className="text-sm sm:text-base text-gray-600 sm:ml-15">
                Проектная документация, договоры и другие важные документы
              </p>
            </div>
          </div>
        </div>

        {/* Documents Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <DocumentManager clientId={clientData.client.id} canUpload={false} />
        </div>

        {/* Footer Navigation for Mobile */}
        <div className="sm:hidden mt-6 flex justify-center">
          <Link
            href="/client-dashboard"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад
          </Link>
        </div>
      </main>
    </div>
  );
} 