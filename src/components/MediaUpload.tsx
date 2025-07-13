'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image, Receipt, X, CheckCircle, AlertCircle } from 'lucide-react';

interface MediaUploadProps {
  clientId: string;
  blockId: string;
  type: 'photos' | 'receipts';
  onUploadSuccess?: (media: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // в байтах
  userType?: 'admin' | 'client'; // Тип пользователя
}

export default function MediaUpload({ 
  clientId, 
  blockId, 
  type, 
  onUploadSuccess, 
  onUploadError, 
  maxFileSize = 100 * 1024 * 1024, // 100MB по умолчанию
  userType = 'admin'
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = type === 'photos' ? {
    accept: 'image/jpeg,image/png,image/jpg,image/webp',
    maxFiles: 10,
    icon: Image,
    title: 'Загрузить фотографии',
    description: 'Перетащите фотографии сюда или нажмите для выбора',
    fileTypes: 'JPG, PNG, WebP',
    endpoint: '/api/upload/photos',
    multiple: true
  } : {
    accept: 'image/jpeg,image/png,image/jpg,image/webp,application/pdf',
    maxFiles: 5,
    icon: Receipt,
    title: 'Загрузить чеки',
    description: 'Перетащите чеки сюда или нажмите для выбора',
    fileTypes: 'JPG, PNG, WebP, PDF',
    endpoint: '/api/upload/receipts',
    multiple: true
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
  };

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    // Проверяем количество файлов
    if (files.length > config.maxFiles) {
      const error = `Можно загружать максимум ${config.maxFiles} файлов за раз`;
      setUploadStatus('error');
      setUploadMessage(error);
      onUploadError?.(error);
      return;
    }

    // Проверяем размер файлов
    const oversizedFiles = files.filter(file => file.size > maxFileSize);
    if (oversizedFiles.length > 0) {
      const error = `Файлы слишком большие: ${oversizedFiles.map(f => f.name).join(', ')}. Максимальный размер: ${Math.round(maxFileSize / 1024 / 1024)}MB`;
      setUploadStatus('error');
      setUploadMessage(error);
      onUploadError?.(error);
      return;
    }

    // Проверяем типы файлов
    const allowedTypes = config.accept.split(',');
    const invalidFiles = files.filter(file => !allowedTypes.some(type => file.type.includes(type.replace('*', '').replace('.', ''))));
    if (invalidFiles.length > 0) {
      const error = `Неподдерживаемые типы файлов: ${invalidFiles.map(f => f.name).join(', ')}`;
      setUploadStatus('error');
      setUploadMessage(error);
      onUploadError?.(error);
      return;
    }

    setUploading(true);
    setUploadStatus('idle');
    setUploadMessage('');

    try {
      const uploadPromises = files.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('clientId', clientId);
        formData.append('blockId', blockId);
        formData.append('description', '');

        const response = await fetch(config.endpoint, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Ошибка загрузки ${file.name}`);
        }

        return response.json();
      });

      const results = await Promise.all(uploadPromises);
      
      setUploadStatus('success');
      setUploadMessage(`Успешно загружено ${results.length} файлов`);
      
      // Вызываем callback для каждого загруженного файла
      results.forEach(result => {
        onUploadSuccess?.(result);
      });

      // Очищаем input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ошибка загрузки';
      setUploadStatus('error');
      setUploadMessage(errorMessage);
      onUploadError?.(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  const IconComponent = config.icon;

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-gray-400 hover:bg-gray-50'}
          ${uploadStatus === 'success' ? 'border-green-400 bg-green-50' : ''}
          ${uploadStatus === 'error' ? 'border-red-400 bg-red-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={config.accept}
          multiple={config.multiple}
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center space-y-4">
          {uploading ? (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          ) : uploadStatus === 'success' ? (
            <CheckCircle className="h-12 w-12 text-green-600" />
          ) : uploadStatus === 'error' ? (
            <AlertCircle className="h-12 w-12 text-red-600" />
          ) : (
            <IconComponent className="h-12 w-12 text-gray-400" />
          )}

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {uploading ? 'Загрузка...' : config.title}
            </h3>
            <p className="text-sm text-gray-600 mb-2">
              {uploading ? 'Пожалуйста, подождите...' : config.description}
            </p>
            <p className="text-xs text-gray-500">
              Поддерживаемые форматы: {config.fileTypes} (до {Math.round(maxFileSize / 1024 / 1024)}MB)
            </p>
          </div>

          {uploadMessage && (
            <div className={`text-sm p-2 rounded ${
              uploadStatus === 'success' ? 'text-green-700 bg-green-100' : 
              uploadStatus === 'error' ? 'text-red-700 bg-red-100' : ''
            }`}>
              {uploadMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 