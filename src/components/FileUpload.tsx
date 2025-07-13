'use client';

import React, { useState, useRef } from 'react';
import { Upload, File, X, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface FileUploadProps {
  clientId: string;
  onUploadSuccess?: (document: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number; // в байтах
  allowedTypes?: string[];
  userType?: 'admin' | 'client'; // Тип пользователя
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  error?: string;
  id: string;
}

export default function FileUpload({
  clientId,
  onUploadSuccess,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB по умолчанию
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  userType = 'admin'
}: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `Файл слишком большой. Максимальный размер: ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Неподдерживаемый тип файла';
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    // Добавляем файл в список загружаемых
    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: 'uploading',
      id: fileId
    };
    
    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('clientId', clientId);
      formData.append('title', title || file.name);
      formData.append('description', description);

      // Используем cookie-авторизацию для всех пользователей
      const requestOptions: RequestInit = {
        method: 'POST',
        body: formData,
        credentials: 'include'
      };
      
      const response = await fetch('/api/documents/upload', requestOptions);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки файла');
      }

      const result = await response.json();
      
      // Обновляем статус файла на успешный
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: 100, status: 'success' as const }
            : f
        )
      );

      // Очищаем поля
      setTitle('');
      setDescription('');
      
      // Вызываем callback
      if (onUploadSuccess) {
        onUploadSuccess(result.document);
      }

      // Удаляем файл из списка через 2 секунды
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      }, 2000);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      // Обновляем статус файла на ошибку
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, status: 'error' as const, error: errorMessage }
            : f
        )
      );

      if (onUploadError) {
        onUploadError(errorMessage);
      }
    }
  };

  const handleFiles = (files: FileList) => {
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        if (onUploadError) {
          onUploadError(`${file.name}: ${error}`);
        }
        return;
      }
      
      uploadFile(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('📁 FileUpload file input changed:', e.target.files?.length);
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Если клиент - не показываем форму загрузки
  if (userType === 'client') {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">
          Только менеджеры могут загружать документы
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Поля для названия и описания */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Название документа (опционально)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Автоматически из имени файла"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание (опционально)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Краткое описание документа"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Зона загрузки */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          console.log('🔄 FileUpload zona clicked');
          fileInputRef.current?.click();
        }}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Перетащите файлы сюда или нажмите для выбора
        </p>
        <p className="text-sm text-gray-500">
          Поддерживаются: PDF, DOC, DOCX, JPG, PNG (до {Math.round(maxFileSize / 1024 / 1024)}MB)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Список загружаемых файлов */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-medium text-gray-900">Загружаемые файлы:</h4>
          {uploadingFiles.map((uploadingFile) => (
            <div key={uploadingFile.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <File className="h-5 w-5 text-gray-400 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadingFile.file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(uploadingFile.file.size)}
                </p>
                
                {uploadingFile.status === 'uploading' && (
                  <div className="mt-1">
                    <div className="bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadingFile.progress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                {uploadingFile.status === 'error' && (
                  <p className="text-xs text-red-600 mt-1">
                    {uploadingFile.error}
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-0">
                {uploadingFile.status === 'uploading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                )}
                {uploadingFile.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {uploadingFile.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
              </div>
              
              <button
                onClick={() => removeUploadingFile(uploadingFile.id)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 