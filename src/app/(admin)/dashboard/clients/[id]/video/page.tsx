'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Video, Plus, Settings, Eye, EyeOff, Trash2 } from 'lucide-react';

interface Client {
  id: string;
  name: string;
}

interface VideoStream {
  id: string;
  title: string;
  description?: string;
  streamUrl: string;
  isActive: boolean;
  showToClient: boolean;
  createdAt: string;
}

export default function ClientVideoPage() {
  const params = useParams();
  const clientId = params.id as string;
  
  const [client, setClient] = useState<Client | null>(null);
  const [videoStreams, setVideoStreams] = useState<VideoStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    streamUrl: '',
    showToClient: true
  });

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    try {
      // Загружаем данные клиента
      const clientResponse = await fetch(`/api/clients/${clientId}`);
      if (clientResponse.ok) {
        const clientData = await clientResponse.json();
        setClient(clientData);
      }

      // Пока создаем тестовые данные для видео
      setVideoStreams([
        {
          id: '1',
          title: 'Основная камера - гостиная',
          description: 'Обзор основной рабочей зоны',
          streamUrl: 'https://example.com/stream1',
          isActive: true,
          showToClient: true,
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          title: 'Камера кухни',
          description: 'Контроль работ на кухне',
          streamUrl: 'https://example.com/stream2',
          isActive: false,
          showToClient: false,
          createdAt: new Date().toISOString()
        }
      ]);

    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStream = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Имитация добавления потока
    const newStream: VideoStream = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description,
      streamUrl: formData.streamUrl,
      isActive: true,
      showToClient: formData.showToClient,
      createdAt: new Date().toISOString()
    };

    setVideoStreams([...videoStreams, newStream]);
    setShowAddForm(false);
    setFormData({
      title: '',
      description: '',
      streamUrl: '',
      showToClient: true
    });
  };

  const toggleVisibility = async (streamId: string) => {
    setVideoStreams(streams =>
      streams.map(stream =>
        stream.id === streamId
          ? { ...stream, showToClient: !stream.showToClient }
          : stream
      )
    );
  };

  const deleteStream = async (streamId: string) => {
    if (confirm('Удалить видеопоток?')) {
      setVideoStreams(streams => streams.filter(stream => stream.id !== streamId));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Загрузка...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href={`/dashboard/clients/${clientId}`}
              className="flex items-center space-x-2 text-gray-600 hover:text-pink-600"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Назад к клиенту</span>
            </Link>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Видеонаблюдение
              </h1>
              {client && (
                <p className="text-gray-600 mt-1">
                  Клиент: {client.name}
                </p>
              )}
            </div>
            
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Добавить камеру</span>
            </button>
          </div>
        </div>

        {/* Форма добавления */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Добавить видеопоток
              </h3>
              
              <form onSubmit={handleAddStream} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Название камеры
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="Например: Основная камера"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    rows={3}
                    placeholder="Краткое описание расположения камеры"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    URL потока
                  </label>
                  <input
                    type="url"
                    value={formData.streamUrl}
                    onChange={(e) => setFormData({ ...formData, streamUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="https://..."
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="showToClient"
                    checked={formData.showToClient}
                    onChange={(e) => setFormData({ ...formData, showToClient: e.target.checked })}
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                  />
                  <label htmlFor="showToClient" className="ml-2 text-sm text-gray-700">
                    Показывать клиенту
                  </label>
                </div>
                
                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Отмена
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                  >
                    Добавить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Список видеопотоков */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videoStreams.map((stream) => (
            <div key={stream.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              {/* Превью видео */}
              <div className="aspect-video bg-gray-900 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Video className="h-12 w-12 text-gray-500" />
                  <span className="ml-2 text-gray-400">Видеопоток</span>
                </div>
                
                {/* Статус */}
                <div className="absolute top-3 left-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stream.isActive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {stream.isActive ? 'Активна' : 'Неактивна'}
                  </span>
                </div>

                {/* Видимость */}
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stream.showToClient
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {stream.showToClient ? 'Видна клиенту' : 'Скрыта'}
                  </span>
                </div>
              </div>

              {/* Информация */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{stream.title}</h3>
                {stream.description && (
                  <p className="text-sm text-gray-600 mb-3">{stream.description}</p>
                )}
                
                <div className="text-xs text-gray-500 mb-4">
                  Добавлено: {new Date(stream.createdAt).toLocaleDateString('ru-RU')}
                </div>

                {/* Действия */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleVisibility(stream.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        stream.showToClient
                          ? 'text-blue-600 bg-blue-100 hover:bg-blue-200'
                          : 'text-gray-400 bg-gray-100 hover:bg-gray-200'
                      }`}
                      title={stream.showToClient ? 'Скрыть от клиента' : 'Показать клиенту'}
                    >
                      {stream.showToClient ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                    
                    <button
                      className="p-2 text-gray-400 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Настройки"
                    >
                      <Settings className="h-4 w-4" />
                    </button>
                  </div>
                  
                  <button
                    onClick={() => deleteStream(stream.id)}
                    className="p-2 text-red-400 bg-red-100 rounded-lg hover:bg-red-200 transition-colors"
                    title="Удалить"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {videoStreams.length === 0 && (
          <div className="text-center py-12">
            <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Нет видеокамер
            </h3>
            <p className="text-gray-600 mb-4">
              Добавьте первую камеру для видеонаблюдения за объектом
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors mx-auto"
            >
              <Plus className="h-5 w-5" />
              <span>Добавить камеру</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 