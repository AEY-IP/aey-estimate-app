'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image, Receipt, FileText, X, CheckCircle, AlertCircle, Plus } from 'lucide-react';

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'success' | 'error';
  id: string;
  error?: string;
  url?: string;
}

interface VercelBlobUploadProps {
  clientId: string;
  blockId?: string; // Опционально для документов
  type: 'photos' | 'receipts' | 'documents';
  onUploadSuccess?: (file: any) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  className?: string;
}

export default function VercelBlobUpload({
  clientId,
  blockId,
  type,
  onUploadSuccess,
  onUploadError,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  className = ''
}: VercelBlobUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [description, setDescription] = useState('');
  const [title, setTitle] = useState(''); // Для документов
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getConfig = () => {
    switch (type) {
      case 'photos':
        return {
          icon: Image,
          title: 'фотографии',
          allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'],
          acceptString: 'image/jpeg,image/png,image/jpg,image/webp',
          description: 'Поддерживаются: JPG, PNG, WebP',
          endpoint: '/api/upload/photos'
        };
      case 'receipts':
        return {
          icon: Receipt,
          title: 'чеки',
          allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'application/pdf'],
          acceptString: 'image/jpeg,image/png,image/jpg,image/webp,application/pdf',
          description: 'Поддерживаются: JPG, PNG, WebP, PDF',
          endpoint: '/api/upload/receipts'
        };
      case 'documents':
        return {
          icon: FileText,
          title: 'документы',
          allowedTypes: [
            'application/pdf',
            'image/jpeg', 'image/png', 'image/jpg',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          ],
          acceptString: '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png',
          description: 'Поддерживаются: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG',
          endpoint: '/api/upload/documents'
        };
    }
  };

  const config = getConfig();
  const IconComponent = config.icon;

  const validateFile = (file: File): string | null => {
    if (file.size > maxFileSize) {
      return `Файл слишком большой. Максимальный размер: ${Math.round(maxFileSize / 1024 / 1024)}MB`;
    }
    
    if (!config.allowedTypes.includes(file.type)) {
      return 'Неподдерживаемый тип файла';
    }
    
    return null;
  };

  const uploadFile = async (file: File) => {
    const fileId = Math.random().toString(36).substr(2, 9);
    
    console.log(`🔄 Starting upload: ${file.name} (${file.size} bytes)`);
    
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
      
      if (blockId) {
        formData.append('blockId', blockId);
      }
      
      if (type === 'documents' && title) {
        formData.append('title', title);
      }
      
      if (description) {
        formData.append('description', description);
      }

      console.log(`📤 Uploading to: ${config.endpoint}`);

      const response = await fetch(config.endpoint, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка загрузки файла');
      }

      const result = await response.json();
      console.log(`✅ Upload successful:`, result);
      
      // Обновляем статус на успешный
      setUploadingFiles(prev => 
        prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: 100, status: 'success' as const, url: result.url }
            : f
        )
      );

      // Очищаем поля
      if (type === 'documents') setTitle('');
      setDescription('');
      
      // Вызываем callback
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }

      // Удаляем файл из списка через 3 секунды
      setTimeout(() => {
        setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
      }, 3000);

    } catch (error) {
      console.error(`❌ Upload error:`, error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      
      // Обновляем статус на ошибку
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
    console.log(`📁 Processing ${files.length} files`);
    
    Array.from(files).forEach(file => {
      const error = validateFile(file);
      if (error) {
        console.error(`❌ File validation error: ${file.name} - ${error}`);
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
    e.stopPropagation();
    setIsDragOver(false);
    
    console.log('📁 Files dropped');
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log(`📁 File input changed: ${e.target.files?.length || 0} files`);
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const handleZoneClick = () => {
    console.log('🔄 Upload zone clicked');
    fileInputRef.current?.click();
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

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Поля для метаданных */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {type === 'documents' && (
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
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Описание (опционально)
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Краткое описание ${type === 'photos' ? 'фотографии' : type === 'receipts' ? 'чека' : 'документа'}`}
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
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleZoneClick}
      >
        <IconComponent className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-lg font-medium text-gray-900 mb-2">
          Перетащите {config.title} сюда или нажмите для выбора
        </p>
        <p className="text-sm text-gray-500">
          {config.description} (до {Math.round(maxFileSize / 1024 / 1024)}MB)
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={config.acceptString}
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
              <IconComponent className="h-5 w-5 text-gray-400 flex-shrink-0" />
              
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

                {uploadingFile.status === 'success' && uploadingFile.url && (
                  <p className="text-xs text-green-600 mt-1">
                    Файл загружен в Vercel Blob
                  </p>
                )}
              </div>
              
              <div className="flex-shrink-0 flex items-center space-x-2">
                {uploadingFile.status === 'uploading' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                )}
                {uploadingFile.status === 'success' && (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                )}
                {uploadingFile.status === 'error' && (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                
                <button
                  onClick={() => removeUploadingFile(uploadingFile.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 