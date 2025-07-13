'use client';

import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';

export default function TestButtonsPage() {
  const [counter, setCounter] = useState(0);
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addLog('📋 Component mounted');
  }, []);

  useEffect(() => {
    addLog(`📋 selectedBlock changed: ${selectedBlock}`);
  }, [selectedBlock]);

  const handleSimpleClick = () => {
    addLog('🔄 Simple button clicked');
    setCounter(prev => prev + 1);
  };

  const handleBlockSelect = (blockId: string) => {
    addLog(`🔄 Block select clicked: ${blockId}`);
    setSelectedBlock(blockId);
  };

  const handleCloseBlock = () => {
    addLog('🔄 Close block clicked');
    setSelectedBlock(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🧪 Тест кнопок и состояний</h1>

        {/* Простая кнопка */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Простая кнопка (счетчик: {counter})</h2>
          <button
            onClick={handleSimpleClick}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Кликни меня! ({counter})
          </button>
        </div>

        {/* Блоки для тестирования */}
        <div className="bg-white rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Тест выбора блоков</h2>
          
          <div className="space-y-4">
            {['block-1', 'block-2', 'block-3'].map((blockId) => (
              <div key={blockId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Блок {blockId}</h3>
                    <p className="text-sm text-gray-500">Тестовый блок для проверки</p>
                  </div>
                  <button
                    onClick={() => handleBlockSelect(blockId)}
                    className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Выбрать блок</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Условный рендер зоны загрузки */}
        {selectedBlock && (
          <div className="bg-white rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Выбранный блок: {selectedBlock}
              </h2>
              <button
                onClick={handleCloseBlock}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕ Закрыть
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <p className="text-gray-500">Здесь должен быть компонент загрузки</p>
              <p className="text-sm text-gray-400 mt-2">Блок: {selectedBlock}</p>
            </div>
          </div>
        )}

        {/* Лог действий */}
        <div className="bg-white rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📜 Лог действий</h2>
          <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
            {log.length === 0 ? (
              <p className="text-gray-500">Лог пуст</p>
            ) : (
              <div className="space-y-1">
                {log.map((entry, index) => (
                  <div key={index} className="text-sm font-mono">
                    {entry}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              setLog([]);
              addLog('🧹 Log cleared');
            }}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Очистить лог
          </button>
        </div>

        {/* Информация о состоянии */}
        <div className="bg-white rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">📊 Текущее состояние</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Счетчик</p>
              <p className="font-mono text-lg">{counter}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Выбранный блок</p>
              <p className="font-mono text-lg">{selectedBlock || 'null'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 