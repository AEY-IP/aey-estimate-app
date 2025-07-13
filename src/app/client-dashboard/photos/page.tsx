'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Camera, User, LogOut, Home } from 'lucide-react';
import PhotoEventManager from '@/components/PhotoEventManager';

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

export default function ClientPhotosPage() {
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

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/client-logout', { method: 'POST' })
      window.location.href = '/'
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500 mx-auto mb-4"></div>
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
            className="mt-4 inline-flex items-center px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
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
      {/* Top Navigation Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Logo & Navigation */}
            <div className="flex items-center space-x-4">
              <Link 
                href="/client-dashboard" 
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="hidden sm:block">
                  <span className="text-lg font-semibold text-gray-900">Идеальный подрядчик</span>
                  <p className="text-xs text-gray-500">Кабинет клиента</p>
                </div>
              </Link>

              {/* Breadcrumb Navigation */}
              <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500">
                <span>/</span>
                <Camera className="h-4 w-4" />
                <span className="text-gray-900 font-medium">Фотографии</span>
              </div>
            </div>

            {/* Profile & Actions */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-gray-900">{clientData.client.name}</p>
                <p className="text-xs text-gray-600">Клиент</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                title="Выйти"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link 
              href="/client-dashboard"
              className="inline-flex items-center px-4 py-2 text-teal-600 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition-colors group"
            >
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Вернуться в главное меню
            </Link>
          </div>

          {/* Title Section */}
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <Camera className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Фотографии с объекта</h1>
                  <p className="text-gray-600">Проект: {clientData.client.name}</p>
                </div>
              </div>
              <p className="text-gray-600 ml-15">
                Фотоотчеты о выполненных работах и ходе строительства
              </p>
            </div>

            {/* Quick Actions */}
            <div className="hidden md:flex space-x-3">
              <Link
                href="/client-dashboard"
                className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="h-4 w-4 mr-2" />
                Главная
              </Link>
            </div>
          </div>
        </div>

        {/* Photos Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <PhotoEventManager clientId={clientData.client.id} canUpload={false} />
        </div>

        {/* Footer Navigation for Mobile */}
        <div className="md:hidden mt-8 flex justify-center">
          <Link
            href="/client-dashboard"
            className="inline-flex items-center px-6 py-3 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors shadow-lg"
          >
            <Home className="h-5 w-5 mr-2" />
            Вернуться в главное меню
          </Link>
        </div>
      </main>
    </div>
  );
} 