'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileText } from 'lucide-react';

export default function TestUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 Test file input changed:', e.target.files?.length);
    setSelectedFiles(e.target.files);
  };

  const handleZoneClick = () => {
    console.log('🔄 Test zona clicked');
    fileInputRef.current?.click();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 Тест загрузки файлов</h1>
        
        {/* Простая кнопка для теста */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Тест 1: Простая кнопка</h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Выбрать файлы (кнопка)
          </button>
        </div>

        {/* Зона загрузки */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Тест 2: Зона загрузки</h2>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors"
            onClick={handleZoneClick}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Нажмите здесь чтобы выбрать файлы
            </p>
            <p className="text-sm text-gray-500">
              Любые файлы, без ограничений
            </p>
          </div>
        </div>

        {/* Скрытый input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Результаты */}
        {selectedFiles && (
          <div className="bg-white rounded-lg p-6 border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Выбранные файлы ({selectedFiles.length}):</h3>
            {Array.from(selectedFiles).map((file, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg mb-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB • {file.type || 'Неизвестный тип'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Тест 3: Прямой input (видимый) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Тест 3: Прямой input (видимый)</h2>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        {/* Информация для отладки */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">🔍 Отладочная информация</h3>
          <p className="text-blue-800 text-sm">
            Откройте консоль браузера (F12) чтобы увидеть логи о кликах и выборе файлов.
          </p>
          <p className="text-blue-800 text-sm mt-1">
            Состояние fileInputRef: {fileInputRef.current ? '✅ Готов' : '❌ Не готов'}
          </p>
          <div className="mt-2 text-xs text-blue-700">
            <p>• Если кнопка работает, но зона не работает - проблема в CSS или событиях</p>
            <p>• Если прямой input работает - проблема в hidden input или click()</p>
            <p>• Если ничего не работает - проблема в браузере или системе</p>
          </div>
        </div>
      </div>
    </div>
  );
} 