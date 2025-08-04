'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, File, Image, Plus, Edit, Trash2, Upload } from 'lucide-react';

interface Document {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  createdAt: string;
}

interface DocumentEvent {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  documents: Document[];
}

interface DocumentEventManagerProps {
  clientId: string;
  canUpload?: boolean;
}

export default function DocumentEventManager({ clientId, canUpload = true }: DocumentEventManagerProps) {
  const [events, setEvents] = useState<DocumentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  
  // Состояния для создания нового блока
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  
  // Состояния для редактирования блока
  const [editingEvent, setEditingEvent] = useState<DocumentEvent | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Состояния для удаления
  const [deletingEvent, setDeletingEvent] = useState<DocumentEvent | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<Document | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка событий
  const loadEvents = async () => {
    try {
      const apiEndpoint = canUpload 
        ? `/api/document-events?clientId=${clientId}` 
        : '/api/client/documents-blocks'; // TODO: создать этот API для клиентов
      
      const response = await fetch(apiEndpoint);
      
      if (response.ok) {
        const data = await response.json();
        setEvents(data.documentBlocks || []);
      } else {
        console.error('Ошибка загрузки блоков документов:', response.status);
      }
    } catch (error) {
      console.error('Ошибка сети при загрузке блоков документов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [clientId]);

  // Создание нового блока
  const createEvent = async () => {
    if (!newEventTitle.trim()) {
      alert('Пожалуйста, укажите название блока');
      return;
    }

    try {
      const response = await fetch('/api/document-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          title: newEventTitle.trim(),
          description: newEventDescription.trim() || null
        }),
      });

      if (response.ok) {
        setNewEventTitle('');
        setNewEventDescription('');
        setShowCreateForm(false);
        await loadEvents();
      } else {
        const errorData = await response.text();
        alert(`Ошибка создания блока: ${response.statusText}`);
      }
    } catch (error) {
      alert('Ошибка сети при создании блока');
    }
  };

  // Загрузка файлов в блок
  const uploadFiles = async (eventId: string, files: FileList) => {
    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf' && !file.type.includes('document')) {
        alert(`Файл "${file.name}" пропущен. Разрешены только изображения, PDF и документы.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('blockId', eventId);
        formData.append('clientId', clientId);
        formData.append('category', 'document');

        const response = await fetch('/api/documents/upload', {
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

  // Редактирование блока
  const startEdit = (event: DocumentEvent) => {
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
      const response = await fetch(`/api/document-events/${editingEvent.id}`, {
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
  const startDeleteEvent = (event: DocumentEvent) => {
    setDeletingEvent(event);
  };

  const confirmDeleteEvent = async () => {
    if (!deletingEvent) return;

    try {
      const response = await fetch(`/api/document-events/${deletingEvent.id}`, {
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

  // Удаление отдельного документа
  const startDeleteDocument = (document: Document) => {
    setDeletingDocument(document);
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDocument) return;

    try {
      const response = await fetch(`/api/documents/${deletingDocument.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setDeletingDocument(null);
        await loadEvents();
      } else {
        alert(`Ошибка удаления документа: ${response.statusText}`);
      }
    } catch (error) {
      alert('Ошибка сети при удалении документа');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-6 w-6" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-6 w-6" />;
    } else {
      return <File className="h-6 w-6" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-500">Загрузка блоков документов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопка создания */}
      {canUpload && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Блоки документов</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Создать блок
          </button>
        </div>
      )}

      {/* Форма создания блока */}
      {showCreateForm && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="font-medium mb-4">Новый блок документов</h3>
          <div className="space-y-4">
            <input
              type="text"
              value={newEventTitle}
              onChange={(e) => setNewEventTitle(e.target.value)}
              placeholder="Название блока документов"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <textarea
              value={newEventDescription}
              onChange={(e) => setNewEventDescription(e.target.value)}
              placeholder="Описание (необязательно)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={createEvent}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Создать
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewEventTitle('');
                  setNewEventDescription('');
                }}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно редактирования */}
      {editingEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-medium mb-4">Редактировать блок</h3>
            <div className="space-y-4">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Название блока"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Описание (необязательно)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveEdit}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
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
            <h3 className="font-medium mb-4">Удалить блок документов?</h3>
            <p className="text-gray-600 mb-4">
              Блок "{deletingEvent.title}" и все документы в нем будут удалены безвозвратно.
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

      {deletingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="font-medium mb-4">Удалить документ?</h3>
            <p className="text-gray-600 mb-4">
              Документ "{deletingDocument.fileName}" будет удален безвозвратно.
            </p>
            <div className="flex gap-2">
              <button
                onClick={confirmDeleteDocument}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Удалить
              </button>
              <button
                onClick={() => setDeletingDocument(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">Загрузка файлов...</p>
        </div>
      )}

      {/* Список блоков документов */}
      {events.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p>Нет блоков документов</p>
          {canUpload && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Создать первый блок
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className={`border-2 border-dashed rounded-lg p-6 transition-colors ${
                draggedOver === event.id ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
              }`}
              onDragOver={(e) => handleDragOver(e, event.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, event.id)}
            >
              {/* Заголовок блока */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  )}
                </div>
                {canUpload && (
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleFileSelect(event.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Upload className="h-4 w-4" />
                      Добавить файлы
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

              {/* Список документов */}
              {event.documents.length > 0 ? (
                <div className="space-y-3">
                  {event.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                      <div className="flex items-center space-x-3">
                        <div className="text-gray-400">
                          {getFileIcon(document.mimeType)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 break-all">
                            {document.fileName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(document.fileSize)} • {new Date(document.createdAt).toLocaleDateString('ru-RU')}
                          </p>
                          {document.description && (
                            <p className="text-xs text-gray-600 break-all">{document.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={document.filePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Скачать файл"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                        {canUpload && (
                          <button
                            onClick={() => startDeleteDocument(document)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Удалить документ"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">
                    {canUpload 
                      ? 'Перетащите документы сюда или нажмите "Добавить файлы"'
                      : 'В этом блоке пока нет документов'
                    }
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Скрытый input для выбора файлов */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,application/pdf,.doc,.docx,.txt"
        className="hidden"
      />
    </div>
  );
} 