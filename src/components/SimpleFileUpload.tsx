'use client';

import React, { useState } from 'react';
import { Upload, Image, Receipt, FileText } from 'lucide-react';

interface SimpleFileUploadProps {
  clientId: string;
  blockId?: string;
  type: 'photos' | 'receipts' | 'documents';
  className?: string;
}

export default function SimpleFileUpload({ 
  clientId, 
  blockId, 
  type, 
  className = '' 
}: SimpleFileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);

  const getConfig = () => {
    switch (type) {
      case 'photos':
        return {
          icon: Image,
          title: 'фотографии',
          accept: 'image/jpeg,image/png,image/jpg,image/webp',
          endpoint: '/api/upload/photos',
          description: 'JPG, PNG, WebP'
        };
      case 'receipts':
        return {
          icon: Receipt,
          title: 'чеки',
          accept: 'image/jpeg,image/png,image/jpg,image/webp,application/pdf',
          endpoint: '/api/upload/receipts',
          description: 'JPG, PNG, WebP, PDF'
        };
      case 'documents':
        return {
          icon: FileText,
          title: 'документы',
          accept: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
          endpoint: '/api/upload/documents',
          description: 'PDF, DOC, DOCX, XLS, XLSX, JPG, PNG'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const formData = new FormData(e.currentTarget);
      
      const response = await fetch(config.endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        // Перезагружаем страницу для обновления списка файлов
        window.location.reload();
      } else {
        const error = await response.json();
        alert('Ошибка загрузки: ' + (error.error || 'Неизвестная ошибка'));
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Ошибка загрузки файла');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={`bg-white border-2 border-dashed border-gray-300 rounded-lg p-6 ${className}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Скрытые поля */}
        <input type="hidden" name="clientId" value={clientId} />
        {blockId && <input type="hidden" name="blockId" value={blockId} />}

        {/* Иконка и заголовок */}
        <div className="text-center">
          <IconComponent className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Загрузить {config.title}
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Поддерживаются: {config.description}
          </p>
        </div>

        {/* Поля для метаданных */}
        <div className="space-y-3">
          {type === 'documents' && (
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Название документа (опционально)
              </label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Автоматически из имени файла"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Описание (опционально)
            </label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder={`Краткое описание ${type === 'photos' ? 'фотографии' : type === 'receipts' ? 'чека' : 'документа'}`}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="file" className="block text-sm font-medium text-gray-700 mb-1">
              Выберите файл *
            </label>
            <input
              type="file"
              id="file"
              name="file"
              accept={config.accept}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Кнопка отправки */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isUploading}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Загрузка...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Загрузить {config.title}
              </>
            )}
          </button>
        </div>
      </form>

      {/* Fallback без JavaScript */}
      <noscript>
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-800">
            JavaScript отключен. Форма будет работать, но без предварительной проверки файлов.
          </p>
        </div>
      </noscript>
    </div>
  );
} 