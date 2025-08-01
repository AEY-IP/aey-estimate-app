'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, Upload, Plus, Edit, Trash2 } from 'lucide-react';

interface EstimateDocument {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  category: string; // "estimate_main" или "estimate_additional"
  createdAt: string;
}

interface EstimateDocumentManagerProps {
  clientId: string;
  canUpload?: boolean;
}

export default function EstimateDocumentManager({ clientId, canUpload = true }: EstimateDocumentManagerProps) {
  const [documents, setDocuments] = useState<EstimateDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newEstimateName, setNewEstimateName] = useState('');
  const [newEstimateType, setNewEstimateType] = useState<'estimate_main' | 'estimate_additional'>('estimate_main');
  const [newEstimateDescription, setNewEstimateDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Состояния для редактирования
  const [editingDocument, setEditingDocument] = useState<EstimateDocument | null>(null);
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<'estimate_main' | 'estimate_additional'>('estimate_main');
  const [editDescription, setEditDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  // Состояния для удаления
  const [deletingDocument, setDeletingDocument] = useState<EstimateDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Загрузка смет
  const loadEstimates = async () => {
    try {
      const apiEndpoint = canUpload 
        ? `/api/documents?clientId=${clientId}&category=estimate_main,estimate_additional`
        : '/api/client/estimate-documents';
      
      const response = await fetch(apiEndpoint);
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки смет:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEstimates();
  }, [clientId]);

  // Загрузка PDF файла
  const uploadEstimate = async (file: File) => {
    if (!newEstimateName.trim()) {
      alert('Пожалуйста, укажите наименование сметы');
      return;
    }

    if (file.type !== 'application/pdf') {
      alert('Можно загружать только PDF файлы');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', newEstimateName);
      formData.append('description', newEstimateDescription);
      formData.append('category', newEstimateType);
      formData.append('clientId', clientId);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.text();
        if (response.status === 413) {
          alert(`Файл слишком большой. Максимум 100MB.`);
        } else {
          alert(`Ошибка загрузки: ${response.statusText}`);
        }
        return;
      }

      await loadEstimates();
      setShowUploadForm(false);
      setNewEstimateName('');
      setNewEstimateDescription('');
      setNewEstimateType('estimate_main');
      
    } catch (error) {
      alert(`Ошибка сети при загрузке файла`);
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          uploadEstimate(target.files[0]);
        }
      };
      fileInputRef.current.click();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'estimate_main':
        return 'Смета основная';
      case 'estimate_additional':
        return 'Смета на дополнительные работы';
      default:
        return 'Смета';
    }
  };

  const previewDocument = (document: EstimateDocument) => {
    window.open(document.filePath, '_blank');
  };

  // Начать редактирование документа
  const startEdit = (document: EstimateDocument) => {
    setEditingDocument(document);
    setEditName(document.name);
    setEditType(document.category as 'estimate_main' | 'estimate_additional');
    setEditDescription(document.description || '');
  };

  // Сохранить изменения
  const saveEdit = async () => {
    if (!editingDocument || !editName.trim()) {
      alert('Пожалуйста, укажите название сметы');
      return;
    }

    setUpdating(true);

    try {
      const response = await fetch(`/api/documents/${editingDocument.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editName,
          description: editDescription,
          category: editType
        })
      });

      if (response.ok) {
        await loadEstimates();
        setEditingDocument(null);
        setEditName('');
        setEditDescription('');
        setEditType('estimate_main');
      } else {
        const errorData = await response.json();
        alert(`Ошибка редактирования: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      alert('Ошибка сети при редактировании');
    } finally {
      setUpdating(false);
    }
  };

  // Отменить редактирование
  const cancelEdit = () => {
    setEditingDocument(null);
    setEditName('');
    setEditDescription('');
    setEditType('estimate_main');
  };

  // Начать удаление документа
  const startDelete = (document: EstimateDocument) => {
    setDeletingDocument(document);
  };

  // Подтвердить удаление
  const confirmDelete = async () => {
    if (!deletingDocument) return;

    setDeleting(true);

    try {
      const response = await fetch(`/api/documents/${deletingDocument.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadEstimates();
        setDeletingDocument(null);
      } else {
        const errorData = await response.json();
        alert(`Ошибка удаления: ${errorData.error || response.statusText}`);
      }
    } catch (error) {
      alert('Ошибка сети при удалении');
    } finally {
      setDeleting(false);
    }
  };

  // Отменить удаление
  const cancelDelete = () => {
    setDeletingDocument(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {canUpload && (
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Сметы проекта</h2>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить смету
          </button>
        </div>
      )}

      {showUploadForm && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Новая смета
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Наименование сметы"
              value={newEstimateName}
              onChange={(e) => setNewEstimateName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            
            <select
              value={newEstimateType}
              onChange={(e) => setNewEstimateType(e.target.value as 'estimate_main' | 'estimate_additional')}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="estimate_main">Смета основная</option>
              <option value="estimate_additional">Смета на дополнительные работы</option>
            </select>
            
            <textarea
              placeholder="Примечание (необязательно)"
              value={newEstimateDescription}
              onChange={(e) => setNewEstimateDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            
            <div className="flex gap-3">
              <button
                onClick={handleFileSelect}
                disabled={!newEstimateName.trim() || uploading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Выбрать PDF файл
              </button>
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setNewEstimateName('');
                  setNewEstimateDescription('');
                  setNewEstimateType('estimate_main');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Поддерживаются только PDF файлы. Максимум 100MB.
            </p>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Пока нет смет</p>
          {canUpload ? (
            <p className="text-sm">Добавьте первую смету для проекта</p>
          ) : (
            <p className="text-sm">Сметы будут появляться здесь</p>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {documents.map((document) => (
            <div
              key={document.id}
              className="bg-white border rounded-lg p-3 sm:p-4 hover:border-gray-300 transition-all cursor-pointer"
              onClick={() => previewDocument(document)}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="font-medium text-gray-900 break-words text-sm sm:text-base leading-tight">
                    {document.name}
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-blue-600 mt-1">
                    {getCategoryLabel(document.category)}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 break-all leading-tight mt-1">
                    {document.fileName}
                  </p>
                  {document.description && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-1 break-words leading-relaxed">
                      {document.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex-shrink-0">{formatFileSize(document.fileSize)}</span>
                    <span className="flex-shrink-0">
                      {new Date(document.createdAt).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row items-center gap-1">
                  {canUpload && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEdit(document);
                        }}
                        className="p-2 text-gray-400 hover:text-green-500 transition-colors"
                        title="Редактировать смету"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startDelete(document);
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        title="Удалить смету"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  )}
                  <a
                    href={document.filePath}
                    download={document.fileName}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Скачать смету"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
      />

      {/* Модальное окно редактирования */}
      {editingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Редактировать смету</h3>
                <button
                  onClick={cancelEdit}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Наименование сметы
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Наименование сметы"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Тип сметы
                  </label>
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as 'estimate_main' | 'estimate_additional')}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="estimate_main">Смета основная</option>
                    <option value="estimate_additional">Смета на дополнительные работы</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Примечание
                  </label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                    placeholder="Примечание (необязательно)"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={saveEdit}
                  disabled={!editName.trim() || updating}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors"
                >
                  {updating ? 'Сохранение...' : 'Сохранить'}
                </button>
                <button
                  onClick={cancelEdit}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно подтверждения удаления */}
      {deletingDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-red-600">Удалить смету</h3>
                <button
                  onClick={cancelDelete}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  Вы уверены, что хотите удалить эту смету?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg border">
                  <p className="font-medium text-gray-900">{deletingDocument.name}</p>
                  <p className="text-sm text-gray-600">{deletingDocument.fileName}</p>
                  <p className="text-sm text-blue-600">
                    {getCategoryLabel(deletingDocument.category)}
                  </p>
                </div>
                <p className="text-sm text-red-600 mt-2">
                  ⚠️ Это действие нельзя отменить. PDF файл будет удален навсегда.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-300 transition-colors"
                >
                  {deleting ? 'Удаление...' : 'Удалить'}
                </button>
                <button
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {uploading && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Загрузка сметы...
          </div>
        </div>
      )}
    </div>
  );
} 