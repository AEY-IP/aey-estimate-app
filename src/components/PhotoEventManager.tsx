'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, Download, ChevronLeft, ChevronRight } from 'lucide-react';

interface Photo {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  createdAt: string;
}

interface PhotoEvent {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  photos: Photo[];
}

interface PhotoEventManagerProps {
  clientId: string;
  canUpload?: boolean;
}

export default function PhotoEventManager({ clientId, canUpload = true }: PhotoEventManagerProps) {
  const [events, setEvents] = useState<PhotoEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal state for photo preview
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);

  // Загрузка событий
  const loadEvents = async () => {
    try {
      // Используем разные API для админов/менеджеров и клиентов
      const apiEndpoint = canUpload 
        ? `/api/photo-events?clientId=${clientId}` 
        : '/api/client/photos';
      
      console.log('📡 PhotoEventManager: Loading events from:', apiEndpoint);
      console.log('🔧 PhotoEventManager: canUpload =', canUpload);
      console.log('🆔 PhotoEventManager: clientId =', clientId);
      
      const response = await fetch(apiEndpoint);
      console.log('📡 PhotoEventManager: Response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ PhotoEventManager: Received data:', data);
        setEvents(data.photoBlocks || []);
      } else {
        const errorText = await response.text();
        console.error('❌ PhotoEventManager: API error:', response.status, errorText);
      }
    } catch (error) {
      console.error('❌ PhotoEventManager: Network error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [clientId]);

  // Создание нового события
  const createEvent = async () => {
    if (!newEventTitle.trim()) return;

    try {
      const response = await fetch('/api/photo-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId,
          title: newEventTitle,
          description: newEventDescription
        })
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(prev => [data.photoBlock, ...prev]);
        setNewEventTitle('');
        setNewEventDescription('');
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('Ошибка создания события:', error);
    }
  };

  // Загрузка файлов
  const uploadFiles = async (eventId: string, files: FileList) => {
    setUploading(true);
    const results = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        console.warn('Пропущен файл (не изображение):', file.name);
        continue;
      }

      console.log('📤 Загружаем файл:', file.name, 'размер:', Math.round(file.size / 1024), 'KB');

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/photo-events/${eventId}/upload`, {
          method: 'POST',
          body: formData
        });

        console.log('📡 Ответ сервера:', response.status, response.statusText);

        if (response.ok) {
          const data = await response.json();
          console.log('✅ Файл загружен успешно:', data.photo?.fileName);
          results.push(data.photo);
        } else {
          const errorData = await response.text();
          console.error('❌ Ошибка сервера:', response.status, errorData);
          
          // Показываем пользователю конкретную ошибку
          if (response.status === 413) {
            alert(`Файл "${file.name}" слишком большой. Максимум 100MB.`);
          } else if (response.status === 500) {
            try {
              const errorJson = JSON.parse(errorData);
              alert(`Ошибка загрузки "${file.name}": ${errorJson.error}`);
            } catch {
              alert(`Ошибка сервера при загрузке "${file.name}"`);
            }
          } else {
            alert(`Ошибка загрузки "${file.name}": ${response.statusText}`);
          }
        }
      } catch (error) {
        console.error('❌ Ошибка сети при загрузке файла:', file.name, error);
        alert(`Ошибка сети при загрузке "${file.name}". Проверьте подключение к интернету.`);
      }
    }

    console.log('📊 Загружено файлов:', results.length, 'из', files.length);

    // Обновляем список событий
    await loadEvents();
    setUploading(false);
  };

  // Drag & Drop обработчики
  const handleDragOver = (e: React.DragEvent, eventId: string) => {
    e.preventDefault();
    setDraggedOver(eventId);
  };

  const handleDragLeave = () => {
    setDraggedOver(null);
  };

  const handleDrop = (e: React.DragEvent, eventId: string) => {
    e.preventDefault();
    setDraggedOver(null);
    
    if (!canUpload) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      uploadFiles(eventId, files);
    }
  };

  // Обработка выбора файлов
  const handleFileSelect = (eventId: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          uploadFiles(eventId, target.files);
        }
      };
      fileInputRef.current.click();
    }
  };

  // Open photo modal
  const openPhotoModal = (photo: Photo, eventPhotos: Photo[]) => {
    setSelectedPhoto(photo);
    setAllPhotos(eventPhotos);
    setCurrentPhotoIndex(eventPhotos.findIndex(p => p.id === photo.id));
  };

  // Close photo modal
  const closePhotoModal = () => {
    setSelectedPhoto(null);
    setAllPhotos([]);
    setCurrentPhotoIndex(0);
  };

  // Navigate photos in modal
  const navigatePhoto = (direction: 'prev' | 'next') => {
    if (allPhotos.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : allPhotos.length - 1;
    } else {
      newIndex = currentPhotoIndex < allPhotos.length - 1 ? currentPhotoIndex + 1 : 0;
    }
    
    setCurrentPhotoIndex(newIndex);
    setSelectedPhoto(allPhotos[newIndex]);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      
      if (e.key === 'Escape') {
        closePhotoModal();
      } else if (e.key === 'ArrowLeft') {
        navigatePhoto('prev');
      } else if (e.key === 'ArrowRight') {
        navigatePhoto('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, currentPhotoIndex, allPhotos]);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Кнопка создания события */}
      {canUpload && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">События фотографий</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Создать событие
          </button>
        </div>
      )}

      {/* Форма создания события */}
      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Новое событие</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Название события"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Описание (необязательно)"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={createEvent}
                disabled={!newEventTitle.trim()}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewEventTitle('');
                  setNewEventDescription('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Список событий */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>Пока нет событий с фотографиями</p>
          {canUpload && (
            <p className="text-sm mt-2">Создайте первое событие для загрузки фотографий</p>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className={`border rounded-lg p-4 transition-all ${
                draggedOver === event.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onDragOver={(e) => handleDragOver(e, event.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, event.id)}
            >
              {/* Заголовок события */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium">{event.title}</h3>
                  {event.description && (
                    <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                  )}
                  <p className="text-gray-400 text-xs mt-1">
                    {new Date(event.createdAt).toLocaleDateString('ru-RU')}
                  </p>
                </div>
                
                {canUpload && (
                  <button
                    onClick={() => handleFileSelect(event.id)}
                    disabled={uploading}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
                  >
                    Добавить фото
                  </button>
                )}
              </div>

              {/* Сетка фотографий */}
              {event.photos.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {event.photos.map((photo) => (
                    <div 
                      key={photo.id} 
                      className="relative group cursor-pointer"
                      onClick={() => openPhotoModal(photo, event.photos)}
                    >
                      <img
                        src={photo.filePath}
                        alt={photo.fileName}
                        className="w-full h-24 object-cover rounded-lg border transition-transform group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center">
                        <ZoomIn className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-gray-500">
                    {canUpload 
                      ? 'Перетащите фотографии сюда или нажмите "Добавить фото"'
                      : 'В этом событии пока нет фотографий'
                    }
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Photo Preview Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Navigation buttons */}
            {allPhotos.length > 1 && (
              <>
                <button
                  onClick={() => navigatePhoto('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigatePhoto('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Photo counter */}
            {allPhotos.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm">
                {currentPhotoIndex + 1} из {allPhotos.length}
              </div>
            )}

            {/* Download button */}
            <a
              href={selectedPhoto.filePath}
              download={selectedPhoto.fileName}
              className="absolute bottom-4 right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              title="Скачать фото"
            >
              <Download className="h-5 w-5" />
            </a>

            {/* Photo info */}
            <div className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg max-w-md">
              <p className="font-medium text-sm">{selectedPhoto.fileName}</p>
              <p className="text-xs text-gray-300 mt-1">
                {new Date(selectedPhoto.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {selectedPhoto.description && (
                <p className="text-xs text-gray-300 mt-1">{selectedPhoto.description}</p>
              )}
            </div>

            {/* Main photo */}
            <img
              src={selectedPhoto.filePath}
              alt={selectedPhoto.fileName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Click outside to close */}
          <div 
            className="absolute inset-0 -z-10" 
            onClick={closePhotoModal}
          />
        </div>
      )}

      {/* Скрытый input для выбора файлов */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
      />

      {/* Индикатор загрузки */}
      {uploading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Загрузка фотографий...
          </div>
        </div>
      )}
    </div>
  );
} 