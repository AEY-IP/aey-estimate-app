'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Download, FileText, File, Image, Upload, Plus } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  category?: string;
  createdAt: string;
}

interface DocumentManagerProps {
  clientId: string;
  canUpload?: boolean;
}

export default function DocumentManager({ clientId, canUpload = true }: DocumentManagerProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [newDocumentName, setNewDocumentName] = useState('');
  const [newDocumentDescription, setNewDocumentDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Загрузка документов
  const loadDocuments = async () => {
    try {
      const apiEndpoint = canUpload 
        ? `/api/documents?clientId=${clientId}&category=document` 
        : '/api/client/documents';
      
      const response = await fetch(apiEndpoint);
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки документов:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [clientId]);

  // Загрузка файлов
  const uploadFiles = async (files: FileList) => {
    if (!newDocumentName.trim()) {
      alert('Пожалуйста, укажите название документа');
      return;
    }

    setUploading(true);

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
        alert(`Файл "${file.name}" пропущен. Разрешены только изображения и PDF файлы.`);
        continue;
      }

      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', newDocumentName);
        formData.append('description', newDocumentDescription);
        formData.append('category', 'document'); // Явно указываем что это обычный документ
        formData.append('clientId', clientId);

        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const errorData = await response.text();
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

    await loadDocuments();
    setUploading(false);
    setShowUploadForm(false);
    setNewDocumentName('');
    setNewDocumentDescription('');
  };

  const handleFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const target = e.target as HTMLInputElement;
        if (target.files && target.files.length > 0) {
          uploadFiles(target.files);
        }
      };
      fileInputRef.current.click();
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-8 w-8 text-blue-500" />;
    } else if (mimeType === 'application/pdf') {
      return <FileText className="h-8 w-8 text-red-500" />;
    } else {
      return <File className="h-8 w-8 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Байт';
    const k = 1024;
    const sizes = ['Байт', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const previewDocument = (document: Document) => {
    if (document.mimeType.startsWith('image/')) {
      setSelectedDocument(document);
    } else {
      window.open(document.filePath, '_blank');
    }
  };

  const closePreview = () => {
    setSelectedDocument(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedDocument) return;
      if (e.key === 'Escape') closePreview();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedDocument]);

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
          <h2 className="text-xl font-semibold">Документы проекта</h2>
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Добавить документ
          </button>
        </div>
      )}

      {showUploadForm && (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Новый документ
          </h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Название документа"
              value={newDocumentName}
              onChange={(e) => setNewDocumentName(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Описание (необязательно)"
              value={newDocumentDescription}
              onChange={(e) => setNewDocumentDescription(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
            <div className="flex gap-3">
              <button
                onClick={handleFileSelect}
                disabled={!newDocumentName.trim() || uploading}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-300 transition-colors flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Выбрать файлы
              </button>
              <button
                onClick={() => {
                  setShowUploadForm(false);
                  setNewDocumentName('');
                  setNewDocumentDescription('');
                }}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Отмена
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Поддерживаются изображения (JPG, PNG, GIF) и PDF файлы. Максимум 100MB на файл.
            </p>
          </div>
        </div>
      )}

      {documents.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">Пока нет документов</p>
          {canUpload ? (
            <p className="text-sm">Добавьте первый документ для проекта</p>
          ) : (
            <p className="text-sm">Документы будут появляться здесь</p>
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
                  {getFileIcon(document.mimeType)}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <h3 className="font-medium text-gray-900 break-words text-sm sm:text-base leading-tight">
                    {document.name}
                  </h3>
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
                <div className="flex-shrink-0">
                  <a
                    href={document.filePath}
                    download={document.fileName}
                    onClick={(e) => e.stopPropagation()}
                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Скачать документ"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDocument && selectedDocument.mimeType.startsWith('image/') && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 z-10 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <a
              href={selectedDocument.filePath}
              download={selectedDocument.fileName}
              className="absolute bottom-4 right-4 z-10 p-3 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
              title="Скачать документ"
            >
              <Download className="h-5 w-5" />
            </a>

            <div className="absolute bottom-4 left-4 z-10 px-4 py-2 bg-black bg-opacity-50 text-white rounded-lg max-w-md">
              <p className="font-medium text-sm">{selectedDocument.name}</p>
              <p className="text-xs text-gray-300 mt-1">{selectedDocument.fileName}</p>
              {selectedDocument.description && (
                <p className="text-xs text-gray-300 mt-1">{selectedDocument.description}</p>
              )}
            </div>

            <img
              src={selectedDocument.filePath}
              alt={selectedDocument.name}
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div 
            className="absolute inset-0 -z-10" 
            onClick={closePreview}
          />
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
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            Загрузка документов...
          </div>
        </div>
      )}
    </div>
  );
} 