'use client';

import React, { useState } from 'react';
import VercelBlobUpload from '@/components/VercelBlobUpload';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TestVercelUploadPage() {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'photos' | 'receipts' | 'documents'>('documents');

  const handleUploadSuccess = (file: any) => {
    console.log('✅ Upload successful:', file);
    setUploadedFiles(prev => [file, ...prev]);
  };

  const handleUploadError = (error: string) => {
    console.error('❌ Upload error:', error);
    setErrors(prev => [error, ...prev]);
    // Удаляем ошибку через 5 секунд
    setTimeout(() => {
      setErrors(prev => prev.slice(1));
    }, 5000);
  };

  const clearUploaded = () => {
    setUploadedFiles([]);
  };

  const clearErrors = () => {
    setErrors([]);
  };

  // Тестовый ID клиента
  const testClientId = 'test-client-id';
  const testBlockId = 'test-block-id';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Link
              href="/dashboard"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">🧪 Тест Vercel Blob Upload</h1>
              <p className="text-gray-600">
                Тестирование нового компонента загрузки
              </p>
            </div>
          </div>
        </div>

        {/* Переключатель типов */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Выберите тип загрузки</h2>
          <div className="flex space-x-4">
            <button
              onClick={() => setSelectedType('documents')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedType === 'documents'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📄 Документы
            </button>
            <button
              onClick={() => setSelectedType('photos')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedType === 'photos'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📸 Фотографии
            </button>
            <button
              onClick={() => setSelectedType('receipts')}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedType === 'receipts'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🧾 Чеки
            </button>
          </div>
        </div>

        {/* Ошибки */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-red-800 mb-2">Ошибки загрузки:</h3>
                <div className="space-y-1">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      • {error}
                    </p>
                  ))}
                </div>
              </div>
              <button
                onClick={clearErrors}
                className="text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Компонент загрузки */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Загрузка: {selectedType === 'documents' ? 'Документы' : selectedType === 'photos' ? 'Фотографии' : 'Чеки'}
          </h2>
          
          <VercelBlobUpload
            clientId={testClientId}
            blockId={selectedType !== 'documents' ? testBlockId : undefined}
            type={selectedType}
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
            maxFileSize={15 * 1024 * 1024} // 15MB для теста
          />
        </div>

        {/* Загруженные файлы */}
        <div className="bg-white rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Успешно загружено ({uploadedFiles.length})
            </h2>
            {uploadedFiles.length > 0 && (
              <button
                onClick={clearUploaded}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Очистить
              </button>
            )}
          </div>

          {uploadedFiles.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Пока нет загруженных файлов
            </p>
          ) : (
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-lg">
                          {selectedType === 'documents' ? '📄' : selectedType === 'photos' ? '📸' : '🧾'}
                        </span>
                        <h3 className="font-medium text-gray-900">
                          {file.document?.name || file.photo?.fileName || file.receipt?.fileName}
                        </h3>
                      </div>
                      
                      {(file.document?.description || file.photo?.description || file.receipt?.description) && (
                        <p className="text-sm text-gray-600 mb-2">
                          {file.document?.description || file.photo?.description || file.receipt?.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>ID: {file.document?.id || file.photo?.id || file.receipt?.id}</span>
                        <span>Размер: {Math.round((file.document?.fileSize || file.photo?.fileSize || file.receipt?.fileSize) / 1024)} KB</span>
                        <span>Тип: {file.document?.mimeType || file.photo?.mimeType || file.receipt?.mimeType}</span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 ml-4">
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Открыть в Blob ↗
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Информация о тесте */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
          <h3 className="font-medium text-yellow-800 mb-2">ℹ️ Информация о тесте</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Тестовый Client ID: <code className="bg-yellow-100 px-1 rounded">{testClientId}</code></li>
            <li>• Тестовый Block ID: <code className="bg-yellow-100 px-1 rounded">{testBlockId}</code></li>
            <li>• Файлы загружаются в Vercel Blob Storage</li>
            <li>• Метаданные сохраняются в базе данных</li>
            <li>• Максимальный размер файла: 15MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 