'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ZoomIn, Download, ChevronLeft, ChevronRight, Receipt, Plus, FileText, Image, File, Edit, Trash2 } from 'lucide-react';

interface ReceiptFile {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  createdAt: string;
}

interface ReceiptEvent {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  receipts: ReceiptFile[];
}

interface ReceiptEventManagerProps {
  clientId: string;
  canUpload?: boolean;
}

export default function ReceiptEventManager({ clientId, canUpload = true }: ReceiptEventManagerProps) {
  const [events, setEvents] = useState<ReceiptEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Modal state for receipt preview
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptFile | null>(null);
  const [currentReceiptIndex, setCurrentReceiptIndex] = useState(0);
  const [allReceipts, setAllReceipts] = useState<ReceiptFile[]>([]);
  
  // Состояния для редактирования блока
  const [editingEvent, setEditingEvent] = useState<ReceiptEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Состояния для удаления
  const [deletingEvent, setDeletingEvent] = useState<ReceiptEvent | null>(null);
  const [deletingReceipt, setDeletingReceipt] = useState<ReceiptFile | null>(null);

  // Загрузка событий
  const loadEvents = async () => {
    try {
      const apiEndpoint = canUpload 
        ? `/api/receipts?clientId=${clientId}` 
        : '/api/client/receipts';
      
      const response = await fetch(apiEndpoint);
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.receiptBlocks || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки чеков:', error);
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
      const response = await fetch('/api/receipts', {
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
        setEvents(prev => [data.receiptBlock, ...prev]);
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

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert(`Файл "${file.name}" пропущен. Разрешены только изображения и PDF файлы.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`/api/receipts/${eventId}/upload`, {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          if (response.status === 413) {
            alert(`Файл "${file.name}" слишком большой. Максимум 100MB.`);
          } else {
            alert(`Ошибка загрузки "${file.name}": ${response.statusText}`);
          }
        }
      } catch (error) {
        alert(`Ошибка сети при загрузке "${file.name}"`);
      }
    }

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

  // Open receipt modal
  const openReceiptModal = (receipt: ReceiptFile, eventReceipts: ReceiptFile[]) => {
    if (receipt.mimeType.startsWith('image/')) {
      setSelectedReceipt(receipt);
      setAllReceipts(eventReceipts);
      setCurrentReceiptIndex(eventReceipts.findIndex(r => r.id === receipt.id));
    } else {
      // For PDF files, open in new tab
      window.open(receipt.filePath, '_blank');
    }
  };

  // Close receipt modal
  const closeReceiptModal = () => {
    setSelectedReceipt(null);
    setAllReceipts([]);
    setCurrentReceiptIndex(0);
  };

  // Navigate receipts in modal
  const navigateReceipt = (direction: 'prev' | 'next') => {
    if (allReceipts.length === 0) return;
    
    let newIndex;
    if (direction === 'prev') {
      newIndex = currentReceiptIndex > 0 ? currentReceiptIndex - 1 : allReceipts.length - 1;
    } else {
      newIndex = currentReceiptIndex < allReceipts.length - 1 ? currentReceiptIndex + 1 : 0;
    }
    
    setCurrentReceiptIndex(newIndex);
    setSelectedReceipt(allReceipts[newIndex]);
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedReceipt) return;
      
      if (e.key === 'Escape') {
        closeReceiptModal();
      } else if (e.key === 'ArrowLeft') {
        navigateReceipt('prev');
      } else if (e.key === 'ArrowRight') {
        navigateReceipt('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedReceipt, currentReceiptIndex, allReceipts]);

  // Get file icon
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-6 w-6 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-6 w-6 text-red-500" />;
    } else {
      return <File className="h-6 w-6 text-gray-500" />;
    }
  };

  // Редактирование блока
  const startEdit = (event: ReceiptEvent) => {
    setEditingEvent(event);
    setEditTitle(event.title);
    setEditDescription(event.description || '');
  };

  const saveEdit = async () => {
    if (!editingEvent || !editTitle.trim()) {
      alert('Название блока обязательно');
      return;
    }

    try {
      const response = await fetch(`/api/receipt-events/${editingEvent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: editTitle.trim(),
          description: editDescription.trim() || null
        }),
      });

      if (response.ok) {
        setEditingEvent(null);
        await loadEvents();
      } else {
        alert(`Ошибка обновления блока: ${response.statusText}`);
      }
    } catch (error) {
      alert('Ошибка сети при обновлении блока');
    }
  };

  const cancelEdit = () => {
    setEditingEvent(null);
    setEditTitle('');
    setEditDescription('');
  };

  // Удаление блока
  const startDeleteEvent = (event: ReceiptEvent) => {
    setDeletingEvent(event);
  };

  const confirmDeleteEvent = async () => {
    if (!deletingEvent) return;

    try {
      const response = await fetch(`/api/receipt-events/${deletingEvent.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeletingEvent(null);
        await loadEvents();
      } else {
        alert(`Ошибка удаления блока: ${response.statusText}`);
      }
    } catch (error) {
      alert('Ошибка сети при удалении блока');
    }
  };

  // Удаление отдельного чека
  const startDeleteReceipt = (receipt: ReceiptFile) => {
    setDeletingReceipt(receipt);
  };

  const confirmDeleteReceipt = async () => {
    if (!deletingReceipt) return;

    try {
      const response = await fetch(`/api/receipts/${deletingReceipt.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeletingReceipt(null);
        await loadEvents();
      } else {
        alert(`Ошибка удаления чека: ${response.statusText}`);
      }
    } catch (error) {
      alert('Ошибка сети при удалении чека');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canUpload && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">События чеков</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Создать событие
          </button>
        </div>
      )}

      {showCreateForm && (
        <div className="bg-gray-50 p-4 rounded-lg border">
          <h3 className="font-medium mb-3">Новое событие</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Название события"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <textarea
              placeholder="Описание (необязательно)"
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Receipt className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Пока нет событий с чеками</p>
          {canUpload ? (
            <p className="text-sm">Создайте первое событие для загрузки чеков</p>
          ) : (
            <p className="text-sm">Чеки будут появляться здесь</p>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className={`border rounded-lg p-4 transition-all ${
                draggedOver === event.id 
                  ? 'border-purple-500 bg-purple-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onDragOver={(e) => handleDragOver(e, event.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, event.id)}
            >
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
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFileSelect(event.id)}
                      disabled={uploading}
                      className="bg-purple-600 text-white px-3 py-1 rounded text-sm hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
                    >
                      Добавить чек
                    </button>
                    <button
                      onClick={() => startEdit(event)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Редактировать блок"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => startDeleteEvent(event)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Удалить блок"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {event.receipts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {event.receipts.map((receipt) => (
                    <div 
                      key={receipt.id} 
                      className="relative group border rounded-lg p-3 hover:border-gray-300 transition-all bg-white"
                    >
                      <div 
                        className="cursor-pointer"
                        onClick={() => openReceiptModal(receipt, event.receipts)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {getFileIcon(receipt.mimeType)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{receipt.fileName}</p>
                            <p className="text-xs text-gray-500">
                              {Math.round(receipt.fileSize / 1024)} KB
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(receipt.createdAt).toLocaleDateString('ru-RU')}
                            </p>
                          </div>
                          {receipt.mimeType.startsWith('image/') && (
                            <ZoomIn className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>
                      {canUpload && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startDeleteReceipt(receipt);
                          }}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                          title="Удалить чек"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {canUpload 
                      ? 'Перетащите чеки сюда или нажмите "Добавить чек"'
                      : 'В этом событии пока нет чеков'
                    }
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Поддерживаются изображения и PDF файлы
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {selectedReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={closeReceiptModal}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {allReceipts.length > 1 && (
              <>
                <button
                  onClick={() => navigateReceipt('prev')}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={() => navigateReceipt('next')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {allReceipts.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-black bg-opacity-50 text-white rounded-full text-sm">
                {currentReceiptIndex + 1} из {allReceipts.length}
              </div>
            )}

            <a
              href={selectedReceipt.filePath}
              download={selectedReceipt.fileName}
              className="absolute bottom-4 right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              title="Скачать чек"
            >
              <Download className="h-5 w-5" />
            </a>

            <div className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg max-w-md">
              <p className="font-medium text-sm">{selectedReceipt.fileName}</p>
              <p className="text-xs text-gray-300 mt-1">
                {new Date(selectedReceipt.createdAt).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              {selectedReceipt.description && (
                <p className="text-xs text-gray-300 mt-1">{selectedReceipt.description}</p>
              )}
            </div>

            <img
              src={selectedReceipt.filePath}
              alt={selectedReceipt.fileName}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div 
            className="absolute inset-0 -z-10" 
            onClick={closeReceiptModal}
          />
        </div>
      )}

      {/* Модальное окно редактирования блока */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-medium mb-4">Редактировать блок чеков</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Название блока"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Описание (необязательно)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Сохранить
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальные окна подтверждения удаления */}
      {deletingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-medium mb-4">Удалить блок чеков?</h3>
            <p className="text-gray-600 mb-4">
              Блок "{deletingEvent.title}" и все чеки в нем будут удалены безвозвратно.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteEvent}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => setDeletingEvent(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingReceipt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-medium mb-4">Удалить чек?</h3>
            <p className="text-gray-600 mb-4">
              Чек "{deletingReceipt.fileName}" будет удален безвозвратно.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteReceipt}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => setDeletingReceipt(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf"
        className="hidden"
      />

      {uploading && (
        <div className="fixed bottom-4 right-4 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Загрузка чеков...
          </div>
        </div>
      )}
    </div>
  );
} 