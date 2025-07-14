import { Estimate } from '@/types/estimate'

// ============================================================================
// ОБЩИЕ ФУНКЦИИ И УТИЛИТЫ
// ============================================================================

// Функция для сортировки блоков работ в правильном порядке для экспорта
function sortWorksBlocksForExport(worksBlocks: any[]): any[] {
  const blockOrder = [
    'Демонтажные работы - Пол',
    'Демонтажные работы - Стены', 
    'Демонтажные работы - Потолок',
    'Демонтажные работы - Двери, окна',
    'Демонтажные работы - Электрика',
    'Демонтажные работы - Сантехника',
    'Демонтажные работы - Прочее',
    'Стены - черновой этап',
    'Стены - финишный этап',
    'Пол - черновой этап', 
    'Пол - финишный этап',
    'Потолок - черновой этап',
    'Потолок - чистовой этап',
    'Сантнехника - черновой этап',
    'Сантнехника - чистовой этап', 
    'Электрика - черновой этап',
    'Электрика - чистовой этап',
    'Вентиляция',
    'Прочее'
  ]

  // Создаем карту блоков по названиям
  const blocksMap = new Map()
  worksBlocks.forEach(block => {
    blocksMap.set(block.title, block)
  })

  // Сортируем блоки по заданному порядку
  const sortedBlocks: any[] = []
  
  blockOrder.forEach(blockTitle => {
    if (blocksMap.has(blockTitle)) {
      sortedBlocks.push(blocksMap.get(blockTitle))
      blocksMap.delete(blockTitle)
    }
  })

  // Добавляем оставшиеся блоки в конец (если есть неучтенные)
  blocksMap.forEach(block => {
    sortedBlocks.push(block)
  })

  return sortedBlocks
}

// ============================================================================
// ОСНОВНЫЕ СМЕТЫ (ГЛАВНЫЕ ДОКУМЕНТЫ)
// ============================================================================

function calculateMainEstimatePrices(estimate: Estimate, coefficients: any[]) {
  // Для смет по помещениям используем summaryWorksBlock, для квартир - worksBlock
  const hasWorksBlock = (estimate.type === 'rooms' && estimate.summaryWorksBlock) || 
                       (estimate.type === 'apartment' && estimate.worksBlock)
  const hasMaterialsBlock = (estimate.type === 'rooms' && estimate.summaryMaterialsBlock) || 
                           (estimate.type === 'apartment' && estimate.materialsBlock)
  
  if (hasWorksBlock && hasMaterialsBlock && coefficients.length > 0) {
    const estimateCoefficients = estimate.coefficients || []
    const manualPrices = new Set(estimate.manualPrices || [])
    console.log('Main Estimate Export - manualPrices:', estimate.manualPrices)
    console.log('Main Estimate Export - manualPrices Set:', manualPrices)
    
    // Рассчитываем коэффициенты
    const normalCoeff = estimateCoefficients.reduce((acc: number, coeffId: string) => {
      const coeff = coefficients.find((c: any) => c.id === coeffId)
      if (coeff && (!coeff.type || coeff.type === 'normal')) {
        return acc * coeff.value
      }
      return acc
    }, 1)
    
    const finalCoeff = estimateCoefficients.reduce((acc: number, coeffId: string) => {
      const coeff = coefficients.find((c: any) => c.id === coeffId)
      if (coeff && coeff.type === 'final') {
        return acc * coeff.value
      }
      return acc
    }, 1)
    
    // Рассчитываем цены с коэффициентами
    const worksBlock = estimate.type === 'rooms' ? estimate.summaryWorksBlock : estimate.worksBlock
    const adjustedWorksData = worksBlock!.blocks.map(block => ({
      ...block,
      items: block.items.map((item: any) => {
        let adjustedUnitPrice: number
        let adjustedTotalPrice: number
        
        if (manualPrices.has(item.id)) {
          // Для ручных цен применяем только конечные коэффициенты
          adjustedUnitPrice = item.unitPrice * finalCoeff
          adjustedTotalPrice = adjustedUnitPrice * item.quantity
        } else {
          // Для автоматических цен применяем обычные × конечные
          adjustedUnitPrice = item.unitPrice * normalCoeff * finalCoeff
          adjustedTotalPrice = adjustedUnitPrice * item.quantity
        }
        
        return {
          ...item,
          displayUnitPrice: Math.round(adjustedUnitPrice),
          displayTotalPrice: Math.round(adjustedTotalPrice),
          coefficientsApplied: manualPrices.has(item.id) ? `Конечные: ${finalCoeff}` : `Обычные: ${normalCoeff} × Конечные: ${finalCoeff}`
        }
      })
    }))
    
    const totalWorksPrice = adjustedWorksData.reduce((sum, block) => 
      sum + block.items.reduce((blockSum, item) => blockSum + item.displayTotalPrice, 0), 0
    )
    
    // Рассчитываем материалы с коэффициентами
    const globalCoeff = normalCoeff * finalCoeff
    const materialsBlock = estimate.type === 'rooms' ? estimate.summaryMaterialsBlock : estimate.materialsBlock
    const adjustedMaterialsData = materialsBlock!.items.map(item => ({
      ...item,
      displayUnitPrice: Math.round(item.unitPrice * globalCoeff),
      displayTotalPrice: Math.round(item.unitPrice * globalCoeff * item.quantity),
      coefficientsApplied: `Глобальные: ${globalCoeff}`
    }))
    
    const totalMaterialsPrice = adjustedMaterialsData.reduce((sum, item) => sum + item.displayTotalPrice, 0)
    
    // Сортируем блоки работ в правильном порядке
    const sortedWorksData = sortWorksBlocksForExport(adjustedWorksData)
    
    return {
      worksData: sortedWorksData,
      materialsData: adjustedMaterialsData,
      totalWorksPrice,
      totalMaterialsPrice,
      grandTotal: totalWorksPrice + totalMaterialsPrice,
      coefficientsInfo: {
        normal: normalCoeff,
        final: finalCoeff,
        global: globalCoeff,
        applied: estimateCoefficients.map(id => coefficients.find(c => c.id === id)).filter(Boolean)
      }
    }
  } else {
    // Для обычных смет или когда коэффициенты не загружены
    const worksData = estimate.worksBlock?.blocks || []
    const materialsData = estimate.materialsBlock?.items || []
    
    const processedWorksData = worksData.map(block => ({
        ...block,
        items: block.items.map(item => ({
          ...item,
          displayUnitPrice: item.unitPrice,
          displayTotalPrice: item.totalPrice,
          coefficientsApplied: 'Без коэффициентов'
        }))
    }))
    
    // Сортируем блоки работ в правильном порядке
    const sortedWorksData = sortWorksBlocksForExport(processedWorksData)
    
    return {
      worksData: sortedWorksData,
      materialsData: materialsData.map(item => ({
        ...item,
        displayUnitPrice: item.unitPrice,
        displayTotalPrice: item.totalPrice,
        coefficientsApplied: 'Без коэффициентов'
      })),
      totalWorksPrice: estimate.totalWorksPrice,
      totalMaterialsPrice: estimate.totalMaterialsPrice,
      grandTotal: estimate.totalPrice,
      coefficientsInfo: null
    }
  }
}

function generateMainEstimateHTML(estimate: Estimate, coefficients: any[] = [], clientData: any = null, cachedPrices?: any): string {
  const prices = cachedPrices || calculateMainEstimatePrices(estimate, coefficients)
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Смета - ${estimate.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      color: #1a1a1a;
      line-height: 1.6;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
    }
    
    .document {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }
    
    .header {
      background: #000000;
      color: white;
      padding: 25px 30px;
      text-align: center;
    }
    
    .company-name {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
      color: #EC0267;
    }
    
    .company-motto {
      font-size: 14px;
      font-weight: 400;
      color: white;
    }
    
    .content {
      padding: 15px;
    }
    
    .client-section {
      background: #d3d3d3;
      color: #333333;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    
    .client-name {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 12px;
    }
    
    .client-info {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin-bottom: 12px;
    }
    
    .client-info-item {
      font-size: 13px;
    }
    
    .contract-info {
      background: rgba(255,255,255,0.3);
      padding: 10px;
      border-radius: 6px;
      text-align: center;
      font-weight: 500;
      font-size: 13px;
    }
    
    .works-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #232323;
      margin-bottom: 20px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e5e7eb;
    }
    
    .block-title-row {
      background: linear-gradient(135deg, #232323 0%, #404040 100%);
      color: white;
    }
    
    .block-title-row td {
      padding: 12px 4px;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      border: none;
    }
    
    .works-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      max-width: 100%;
    }
    
    .works-table th,
    .works-table td {
      padding: 8px 4px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .works-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
      text-align: center;
    }
    
    .works-table tr:hover:not(.total-row):not(.block-total):not(.block-title-row) {
      background: #f9fafb;
    }
    
    .works-table td:nth-child(1) {
      width: 30px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(2) {
      width: 400px !important;
      text-align: left !important;
    }
    
    .works-table td:nth-child(3) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(4) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(5) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .works-table td:nth-child(6) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .number {
      text-align: center !important;
    }
    
    .currency {
      text-align: right !important;
    }
    
    .work-name {
      text-align: left !important;
    }
    
    .total-row {
      background: linear-gradient(135deg, #EC0267 0%, #ff1a7a 100%);
      color: white;
      font-weight: 600;
    }
    
    .total-row td {
      padding: 12px 4px;
      border: none;
    }
    
    .block-total {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    
    .materials-section {
      margin-bottom: 30px;
    }
    
    .materials-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      max-width: 100%;
    }
    
    .materials-table th,
    .materials-table td {
      padding: 8px 4px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .materials-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
      text-align: center;
    }
    
    .materials-table tr:hover:not(.total-row) {
      background: #f9fafb;
    }
    
    .materials-table td:nth-child(1) {
      width: 30px !important;
      text-align: center !important;
    }
    
    .materials-table td:nth-child(2) {
      width: 400px !important;
      text-align: left !important;
    }
    
    .materials-table td:nth-child(3) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .materials-table td:nth-child(4) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .materials-table td:nth-child(5) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .materials-table td:nth-child(6) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .summary-section {
      margin-top: 30px;
      padding: 20px;
      background: #f8fafc;
      border-radius: 8px;
    }
    
    .summary-title {
      font-size: 18px;
      font-weight: 600;
      color: #232323;
      margin-bottom: 15px;
    }
    
    .summary-table {
      width: 100%;
      border-collapse: collapse;
    }
    
    .summary-table td {
      padding: 8px 0;
      font-size: 14px;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .summary-table td:first-child {
      font-weight: 500;
      color: #374151;
    }
    
    .summary-table td:last-child {
      text-align: right;
      font-weight: 600;
      color: #EC0267;
    }
    
    .summary-table tr:last-child td {
      border-bottom: none;
      font-size: 16px;
      padding-top: 15px;
    }
    
    @media print {
      body {
        padding: 0;
        margin: 0;
        background: white;
      }
      
      .document {
        max-width: 100%;
        margin: 0;
        box-shadow: none;
        border-radius: 0;
      }
      
      .works-table,
      .materials-table {
        page-break-inside: avoid;
      }
      
      .block-title-row {
        page-break-after: avoid;
      }
      
      .total-row {
        page-break-before: avoid;
      }
    }
    
    @page {
      margin: 10mm;
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div class="company-name">Идеальный подрядчик</div>
      <div class="company-motto">Быстро. Четко. Компонентно.</div>
    </div>

    <div class="content">
      ${clientData ? `
        <div class="client-section">
          <div class="client-name">${clientData.name}</div>
          <div class="client-info">
            <div class="client-info-item">
              <strong>Телефон:</strong> ${clientData.phone || 'Не указан'}
            </div>
            <div class="client-info-item">
              <strong>Адрес:</strong> ${clientData.address || 'Не указан'}
            </div>
          </div>
          ${clientData.contractNumber ? `
            <div class="contract-info">
              Приложение №2 к договору ${clientData.contractNumber}
            </div>
          ` : ''}
        </div>
      ` : ''}

      <div class="works-section">
        <h2 class="section-title">Работы</h2>
        <table class="works-table">
          <thead>
            <tr>
              <th>№</th>
              <th>Наименование работ</th>
              <th>Ед. изм.</th>
              <th>Кол-во</th>
              <th>Цена за ед.</th>
              <th>Стоимость</th>
            </tr>
          </thead>
          <tbody>
            ${(() => {
              let globalItemNumber = 1;
              
              if (!prices.worksData || prices.worksData.length === 0) {
                return '<tr><td colspan="6" style="text-align: center; padding: 40px;">Работы не добавлены</td></tr>';
              }
              
              return prices.worksData.flatMap((block: any) => {
                if (!block.items || block.items.length === 0) return [];
                
                return [
                  `<tr class="block-title-row">
                    <td colspan="6">${block.title}</td>
                  </tr>`,
                  ...block.items.map((item: any) => `
                    <tr>
                      <td class="number">${globalItemNumber++}</td>
                      <td class="work-name">${item.workName || item.name}${item.description ? ` (${item.description})` : ''}</td>
                      <td class="number">${item.unit}</td>
                      <td class="number">${item.quantity}</td>
                      <td class="currency">${(item.displayUnitPrice || item.unitPrice || 0).toLocaleString('ru-RU')} ₽</td>
                      <td class="currency">${(item.displayTotalPrice || item.totalPrice || 0).toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  `),
                  `<tr class="block-total">
                    <td colspan="5" style="text-align: right;">Итого по блоку "${block.title}":</td>
                    <td class="currency">${(block.items.reduce((sum: number, item: any) => sum + (item.displayTotalPrice || item.totalPrice), 0)).toLocaleString('ru-RU')} ₽</td>
                  </tr>`
                ];
              }).join('');
            })()}
            <tr class="total-row">
              <td colspan="5" style="text-align: right; font-size: 16px;">ИТОГО ПО РАБОТАМ:</td>
              <td class="currency" style="font-size: 16px;">${prices.totalWorksPrice.toLocaleString('ru-RU')} ₽</td>
            </tr>
          </tbody>
        </table>
      </div>

      ${prices.materialsData && prices.materialsData.length > 0 ? `
        <div class="materials-section">
          <h2 class="section-title">Материалы</h2>
          <table class="materials-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Наименование материала</th>
                <th>Ед. изм.</th>
                <th>Кол-во</th>
                <th>Цена за ед.</th>
                <th>Стоимость</th>
              </tr>
            </thead>
            <tbody>
              ${prices.materialsData.map((item: any, index: number) => `
                <tr>
                  <td class="number">${index + 1}</td>
                  <td class="work-name">${item.materialName || item.name}${item.description ? ` (${item.description})` : ''}</td>
                  <td class="number">${item.unit}</td>
                  <td class="number">${item.quantity}</td>
                  <td class="currency">${(item.displayUnitPrice || item.unitPrice || 0).toLocaleString('ru-RU')} ₽</td>
                  <td class="currency">${(item.displayTotalPrice || item.totalPrice || 0).toLocaleString('ru-RU')} ₽</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="5" style="text-align: right; font-size: 16px;">ИТОГО ПО МАТЕРИАЛАМ:</td>
                <td class="currency" style="font-size: 16px;">${prices.totalMaterialsPrice.toLocaleString('ru-RU')} ₽</td>
              </tr>
            </tbody>
          </table>
        </div>
      ` : ''}

      <div class="summary-section">
        <h3 class="summary-title">Общая сметная стоимость</h3>
        <table class="summary-table">
          <tr>
            <td><strong>ОБЩАЯ СМЕТНАЯ СТОИМОСТЬ:</strong></td>
            <td><strong>${prices.grandTotal.toLocaleString('ru-RU')} ₽</strong></td>
          </tr>
        </table>
      </div>
    </div>
  </div>
  
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 100);
    });
  </script>
</body>
</html>`
}

export function generateEstimatePDF(estimate: Estimate, coefficients: any[] = [], clientData: any = null) {
  // Определяем тип сметы и используем соответствующую функцию
  let htmlContent: string
  
  if (estimate.category === 'additional') {
    // Для дополнительных смет используем отдельную функцию
    htmlContent = generateAdditionalEstimateHTML(estimate, coefficients, clientData)
  } else {
    // Для основных смет используем отдельную функцию
    htmlContent = generateMainEstimateHTML(estimate, coefficients, clientData)
  }
  
  // Открываем новое окно для печати
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    // Печать запускается автоматически через JavaScript в HTML
  }
}

export function downloadEstimateHTML(estimate: Estimate, coefficients: any[] = [], clientData: any = null) {
  // Определяем тип сметы и используем соответствующую функцию
  let htmlContent: string
  let filename: string
  
  if (estimate.category === 'additional') {
    // Для дополнительных смет используем отдельную функцию
    htmlContent = generateAdditionalEstimateHTML(estimate, coefficients, clientData)
    filename = `дополнительная_смета_${estimate.title}_${new Date().toISOString().split('T')[0]}.html`
  } else {
    // Для основных смет используем отдельную функцию
    htmlContent = generateMainEstimateHTML(estimate, coefficients, clientData)
    filename = `основная_смета_${estimate.title}_${new Date().toISOString().split('T')[0]}.html`
  }
  
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

// ============================================================================
// ДОПОЛНИТЕЛЬНЫЕ СМЕТЫ
// ============================================================================

function calculateAdditionalEstimatePrices(estimate: Estimate, coefficients: any[]) {
  // Копируем логику основных смет, но с префиксом для логирования
  const hasWorksBlock = (estimate.type === 'rooms' && estimate.summaryWorksBlock) || 
                       (estimate.type === 'apartment' && estimate.worksBlock)
  const hasMaterialsBlock = (estimate.type === 'rooms' && estimate.summaryMaterialsBlock) || 
                           (estimate.type === 'apartment' && estimate.materialsBlock)
  
  if (hasWorksBlock && hasMaterialsBlock && coefficients.length > 0) {
    const estimateCoefficients = estimate.coefficients || []
    const manualPrices = new Set(estimate.manualPrices || [])
    console.log('Additional Estimate Export - manualPrices:', estimate.manualPrices)
    console.log('Additional Estimate Export - manualPrices Set:', manualPrices)
    
    // Рассчитываем коэффициенты
    const normalCoeff = estimateCoefficients.reduce((acc: number, coeffId: string) => {
      const coeff = coefficients.find((c: any) => c.id === coeffId)
      if (coeff && (!coeff.type || coeff.type === 'normal')) {
        return acc * coeff.value
      }
      return acc
    }, 1)
    
    const finalCoeff = estimateCoefficients.reduce((acc: number, coeffId: string) => {
      const coeff = coefficients.find((c: any) => c.id === coeffId)
      if (coeff && coeff.type === 'final') {
        return acc * coeff.value
      }
      return acc
    }, 1)
    
    // Рассчитываем цены с коэффициентами
    const worksBlock = estimate.type === 'rooms' ? estimate.summaryWorksBlock : estimate.worksBlock
    const adjustedWorksData = worksBlock!.blocks.map(block => ({
      ...block,
      items: block.items.map((item: any) => {
        let adjustedUnitPrice: number
        let adjustedTotalPrice: number
        
        if (manualPrices.has(item.id)) {
          // Для ручных цен применяем только конечные коэффициенты
          adjustedUnitPrice = item.unitPrice * finalCoeff
          adjustedTotalPrice = adjustedUnitPrice * item.quantity
        } else {
          // Для автоматических цен применяем обычные × конечные
          adjustedUnitPrice = item.unitPrice * normalCoeff * finalCoeff
          adjustedTotalPrice = adjustedUnitPrice * item.quantity
        }
        
        return {
          ...item,
          displayUnitPrice: Math.round(adjustedUnitPrice),
          displayTotalPrice: Math.round(adjustedTotalPrice),
          coefficientsApplied: manualPrices.has(item.id) ? `Конечные: ${finalCoeff}` : `Обычные: ${normalCoeff} × Конечные: ${finalCoeff}`
        }
      })
    }))
    
    const totalWorksPrice = adjustedWorksData.reduce((sum, block) => 
      sum + block.items.reduce((blockSum, item) => blockSum + item.displayTotalPrice, 0), 0
    )
    
    // Рассчитываем материалы с коэффициентами
    const globalCoeff = normalCoeff * finalCoeff
    const materialsBlock = estimate.type === 'rooms' ? estimate.summaryMaterialsBlock : estimate.materialsBlock
    const adjustedMaterialsData = materialsBlock!.items.map(item => ({
      ...item,
      displayUnitPrice: Math.round(item.unitPrice * globalCoeff),
      displayTotalPrice: Math.round(item.unitPrice * globalCoeff * item.quantity),
      coefficientsApplied: `Глобальные: ${globalCoeff}`
    }))
    
    const totalMaterialsPrice = adjustedMaterialsData.reduce((sum, item) => sum + item.displayTotalPrice, 0)
    
    // Сортируем блоки работ в правильном порядке
    const sortedWorksData = sortWorksBlocksForExport(adjustedWorksData)
    
    return {
      worksData: sortedWorksData,
      materialsData: adjustedMaterialsData,
      totalWorksPrice,
      totalMaterialsPrice,
      grandTotal: totalWorksPrice + totalMaterialsPrice,
      coefficientsInfo: {
        normal: normalCoeff,
        final: finalCoeff,
        global: globalCoeff,
        applied: estimateCoefficients.map(id => coefficients.find(c => c.id === id)).filter(Boolean)
      }
    }
  } else {
    // Для обычных смет или когда коэффициенты не загружены
    const worksData = estimate.worksBlock?.blocks || []
    const materialsData = estimate.materialsBlock?.items || []
    
    const processedWorksData = worksData.map(block => ({
        ...block,
        items: block.items.map(item => ({
          ...item,
          displayUnitPrice: item.unitPrice,
          displayTotalPrice: item.totalPrice,
          coefficientsApplied: 'Без коэффициентов'
        }))
    }))
    
    // Сортируем блоки работ в правильном порядке
    const sortedWorksData = sortWorksBlocksForExport(processedWorksData)
    
    return {
      worksData: sortedWorksData,
      materialsData: materialsData.map(item => ({
        ...item,
        displayUnitPrice: item.unitPrice,
        displayTotalPrice: item.totalPrice,
        coefficientsApplied: 'Без коэффициентов'
      })),
      totalWorksPrice: estimate.totalWorksPrice,
      totalMaterialsPrice: estimate.totalMaterialsPrice,
      grandTotal: estimate.totalPrice,
      coefficientsInfo: null
    }
  }
}

function generateAdditionalEstimateHTML(estimate: Estimate, coefficients: any[] = [], clientData: any = null, cachedPrices?: any): string {
  const prices = cachedPrices || calculateAdditionalEstimatePrices(estimate, coefficients)
  
  // Получаем настройки дополнительного соглашения из estimate или используем значения по умолчанию
  const additionalSettings = estimate.additionalAgreementSettings || {
    dsDate: new Date().toLocaleDateString('ru-RU'),
    clientName: clientData?.name || 'Клиент',
    contractNumber: clientData?.contractNumber || 'Не указан',
    contractDate: clientData?.contractDate || 'Не указана',
    workPeriod: '10',
    contractor: 'Индивидуальный предприниматель Алексеев Сергей Алексеевич'
  }

  // Форматируем даты для красивого отображения
  const formattedDsDate = formatDateForAct(additionalSettings.dsDate)
  const formattedContractDate = formatDateForAct(additionalSettings.contractDate)

  return `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Дополнительное соглашение - ${estimate.title}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.6;
            color: #232323;
            background: #ffffff;
            padding: 20px;
        }
        
        .container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border-radius: 8px;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding: 20px;
            background: #000000;
            color: white;
            border-radius: 8px;
        }
        
        .header h1 {
            font-size: 24px;
            font-weight: 700;
            margin-bottom: 5px;
            color: #EC0267;
        }
        
        .header .subtitle {
            font-size: 14px;
            font-weight: 400;
            color: white;
        }
        
        .agreement-title {
            text-align: center;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 20px;
            line-height: 1.4;
        }
        
        .date-location {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            font-size: 14px;
        }
        
        .agreement-text {
            margin-bottom: 20px;
            text-align: justify;
            line-height: 1.6;
        }
        
        .section-number {
            font-weight: 600;
            margin-bottom: 10px;
        }
        
        .works-section {
            margin: 20px 0;
        }
        
        .works-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 1px solid #e5e7eb;
        }
        
        .works-table th {
            background: #f8fafc;
            color: #374151;
            font-weight: 600;
            padding: 12px 8px;
            text-align: left;
            border-bottom: 2px solid #e5e7eb;
            font-size: 12px;
        }
        
        .works-table td {
            padding: 10px 8px;
            border-bottom: 1px solid #f3f4f6;
            font-size: 13px;
        }
        
        .works-table tr:nth-child(even) {
            background: #f9fafb;
        }
        
        .block-title {
            background: #e5e7eb;
            font-weight: 600;
            padding: 12px 8px;
            text-align: center;
            font-size: 14px;
        }
        
        .text-right {
            text-align: right;
        }
        
        .text-center {
            text-align: center;
        }
        
        .font-medium {
            font-weight: 500;
        }
        
        .font-semibold {
            font-weight: 600;
        }
        
        .total-row {
            background: #f3f4f6;
            font-weight: 600;
            font-size: 14px;
        }
        
        .signatures-title {
            text-align: center;
            font-weight: 600;
            margin: 30px 0 20px 0;
            font-size: 16px;
        }
        
        .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 20px;
        }
        
        .signature-block {
            text-align: center;
        }
        
        .signature-role {
            font-weight: 600;
            margin-bottom: 40px;
        }
        
        .signature-line {
            border-bottom: 1px solid #374151;
            height: 1px;
            margin: 0 0 10px 0;
        }
        
        .signature-label {
            font-size: 12px;
            color: #6b7280;
        }
        
        @media print {
            body {
                padding: 0;
                background: white;
            }
            
            .container {
                box-shadow: none;
                border-radius: 0;
                max-width: none;
                padding: 20px;
            }
        }
        
        @page {
            size: A4;
            margin: 1cm;
        }
    </style>
    <script>
        window.onload = function() {
            setTimeout(function() {
                window.print();
            }, 500);
        }
    </script>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Идеальный подрядчик</h1>
            <div class="subtitle">Быстро. Четко. Компонентно.</div>
        </div>
        
        <div class="agreement-title">
            ДОПОЛНИТЕЛЬНОЕ СОГЛАШЕНИЕ<br>
            к договору подряда на выполнение ремонтно-отделочных работ<br>
            ${additionalSettings.contractNumber} от ${formattedContractDate} года
        </div>
        
        <div class="date-location">
            <span>${formattedDsDate}</span>
            <span>г. Москва</span>
        </div>
        
        <div class="agreement-text">
            ${additionalSettings.clientName}, именуемый в дальнейшем «Заказчик», с одной стороны, и ${additionalSettings.contractor}, именуемый в дальнейшем «Подрядчик», совместно именуемые «Стороны», заключили настоящее дополнительное соглашение к Договору подряда на выполнение ремонтно-отделочных работ ${additionalSettings.contractNumber} от ${formattedContractDate} года (далее по тексту - «Договор») о нижеследующем:
        </div>
        
        <div class="section-number">
            1. Стороны пришли к соглашению о выполнении Подрядчиком следующих дополнительных работ, не учтенных сметой:
        </div>
        
        <div class="works-section">
            <table class="works-table">
                <thead>
                    <tr>
                        <th style="width: 5%;">№</th>
                        <th style="width: 45%;">Наименование работ</th>
                        <th style="width: 10%;">Ед. изм.</th>
                        <th style="width: 10%;">Кол-во</th>
                        <th style="width: 15%;">Цена за ед.</th>
                        <th style="width: 15%;">Стоимость</th>
                    </tr>
                </thead>
                <tbody>
                    ${prices.worksData.map((block: any) => `
                        <tr>
                            <td colspan="6" class="block-title">${block.title}</td>
                        </tr>
                        ${block.items.map((item: any, index: number) => `
                            <tr>
                                <td class="text-center">${index + 1}</td>
                                <td class="font-medium">${item.name}</td>
                                <td class="text-center">${item.unit}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">${item.displayUnitPrice ? item.displayUnitPrice.toLocaleString('ru-RU') : item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                                <td class="text-right font-semibold">${item.displayTotalPrice ? item.displayTotalPrice.toLocaleString('ru-RU') : item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                            </tr>
                        `).join('')}
                    `).join('')}
                    
                    ${prices.materialsData.length > 0 ? `
                        <tr>
                            <td colspan="6" class="block-title">Материалы</td>
                        </tr>
                        ${prices.materialsData.map((item: any, index: number) => `
                            <tr>
                                <td class="text-center">${index + 1}</td>
                                <td class="font-medium">${item.name}</td>
                                <td class="text-center">${item.unit}</td>
                                <td class="text-center">${item.quantity}</td>
                                <td class="text-right">${item.displayUnitPrice ? item.displayUnitPrice.toLocaleString('ru-RU') : item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                                <td class="text-right font-semibold">${item.displayTotalPrice ? item.displayTotalPrice.toLocaleString('ru-RU') : item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                            </tr>
                        `).join('')}
                    ` : ''}
                    
                    <tr class="total-row">
                        <td colspan="5" class="text-right font-semibold">ИТОГО:</td>
                        <td class="text-right font-semibold">${prices.grandTotal.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="agreement-text">
            <div class="section-number">
                2. Срок выполнения дополнительных работ: ${additionalSettings.workPeriod} рабочих дней дополнительно к сроку, согласованному Договором. Начало выполнения дополнительных работ - в течение 3х рабочих дней с даты подписания настоящего дополнительного соглашения. Оплата дополнительных работ производится Заказчиком в порядке и на условиях, предусмотренных Договором.
            </div>
            
            <div class="section-number">
                3. Во всем, что не урегулировано и не изменено настоящим дополнительным соглашением, Стороны будут руководствоваться условиями Договора.
            </div>
            
            <div class="section-number">
                4. Настоящее дополнительное соглашение вступает в силу с момента его подписания и действует до полного исполнения или расторжения Сторонами Договора.
            </div>
            
            <div style="margin-top: 15px;">
                Настоящее дополнительное соглашение составлено в 2 (двух) экземплярах, по одному экземпляру для каждой из Сторон.
            </div>
        </div>
        
        <div class="signatures-title">
            РЕКВИЗИТЫ И ПОДПИСИ СТОРОН:
        </div>
        
        <div class="signatures">
            <div class="signature-block">
                <div class="signature-role">ЗАКАЗЧИК</div>
                <div class="signature-line"></div>
                <div class="signature-label">подпись</div>
            </div>
            <div class="signature-block">
                <div class="signature-role">ПОДРЯДЧИК</div>
                <div class="signature-line"></div>
                <div class="signature-label">подпись</div>
            </div>
        </div>
    </div>
</body>
</html>`
}

// ============================================================================
// ОБЩИЕ ФУНКЦИИ ДЛЯ КЕШИРОВАНИЯ (используются всеми типами)
// ============================================================================

export async function generateEstimatePDFWithCache(
  estimate: any, 
  clientData: any = null
) {
  console.log('=== GENERATE ESTIMATE PDF WITH CACHE ===')
  
  try {
    // Используем универсальную функцию для получения данных с коэффициентами
    const estimateData = await getEstimateDataWithCoefficients(estimate)
    
    // Создаем объект с кешированными данными для передачи в HTML генератор
    const estimateWithCache = {
      ...estimate,
      calculatedWorksData: estimateData.worksData,
      calculatedMaterialsData: estimateData.materialsData,
      calculatedTotalWorksPrice: estimateData.totalWorksPrice,
      calculatedTotalMaterialsPrice: estimateData.totalMaterialsPrice,
      calculatedGrandTotal: estimateData.grandTotal,
      totalWorksPrice: estimateData.totalWorksPrice,
      totalMaterialsPrice: estimateData.totalMaterialsPrice,
      totalPrice: estimateData.grandTotal,
      // Сохраняем настройки дополнительного соглашения
      additionalAgreementSettings: estimate.additionalAgreementSettings
    }
    
    console.log('Estimate data prepared:', {
      worksBlocksCount: estimateData.worksData?.length || 0,
      totalWorksPrice: estimateData.totalWorksPrice,
      grandTotal: estimateData.grandTotal
    })
    
    // Определяем тип сметы и используем соответствующую функцию
    let htmlContent: string
    
    if (estimate.category === 'additional') {
      // Для дополнительных смет используем отдельную функцию
      htmlContent = generateAdditionalEstimateHTML(estimateWithCache, [], clientData, estimateData)
    } else {
      // Для основных смет используем отдельную функцию
      htmlContent = generateMainEstimateHTML(estimateWithCache, [], clientData, estimateData)
    }
    
    // Открываем новое окно для печати
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
    }
    
  } catch (error) {
    console.error('Error generating estimate PDF with cache:', error)
    
    // Fallback: используем старую функцию без кеша
    generateEstimatePDF(estimate, [], clientData)
  }
}

// ============================================================================
// ФУНКЦИИ ДЛЯ АКТОВ (сохраняем текущий функционал)
// ============================================================================

// Функция для генерации PDF актов с измененной шапкой
export async function generateActPDF(act: any, actDate: string, clientData: any = null) {
  console.log('=== GENERATE ACT PDF START ===')
  
  try {
    // Используем универсальную функцию для получения данных с коэффициентами
    const estimateData = await getEstimateDataWithCoefficients(act)
    
    // Добавляем рассчитанные данные в объект акта для использования в HTML
    act.calculatedWorksData = estimateData.worksData
    act.calculatedMaterialsData = estimateData.materialsData
    act.calculatedTotalWorksPrice = estimateData.totalWorksPrice
    act.calculatedTotalMaterialsPrice = estimateData.totalMaterialsPrice
    act.calculatedGrandTotal = estimateData.grandTotal
    
    console.log('Act data prepared for PDF generation:', {
      worksBlocksCount: estimateData.worksData?.length || 0,
      totalWorksPrice: estimateData.totalWorksPrice,
      grandTotal: estimateData.grandTotal
    })
    
  } catch (error) {
    console.error('Error preparing act data:', error)
    
    // Fallback: используем базовые данные
    act.calculatedGrandTotal = act.totalWorksPrice
  }
  
  console.log('=== GENERATE ACT PDF - GENERATING HTML ===')
  const htmlContent = generateActHTML(act, actDate, clientData)
  
  // Открываем новое окно для печати
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    // Печать запускается автоматически через JavaScript в HTML
  }
}

function generateActHTML(act: any, actDate: string, clientData: any = null): string {
  // Форматируем дату для отображения
  const formattedDate = new Date(actDate).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long', 
    day: 'numeric'
  })

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Акт - ${act.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      color: #1a1a1a;
      background: #f9f9f9;
    }
    
    .document {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: #000000;
      color: white;
      text-align: center;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #EC0267;
      margin-bottom: 5px;
    }
    
    .company-motto {
      font-size: 12px;
      font-weight: 400;
      color: white;
    }
    
    .act-title {
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    
    .works-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #232323;
      margin-bottom: 20px;
    }
    
    .works-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      max-width: 100%;
    }
    
    .works-table th,
    .works-table td {
      padding: 8px 4px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .works-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
      text-align: center;
    }
    
    .works-table tr:hover:not(.total-row):not(.block-total):not(.block-title-row) {
      background: #f9fafb;
    }
    
    .works-table td:nth-child(1) {
      width: 30px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(2) {
      width: 400px !important;
      text-align: left !important;
    }
    
    .works-table td:nth-child(3) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(4) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(5) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .works-table td:nth-child(6) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .number {
      text-align: center !important;
    }
    
    .currency {
      text-align: right !important;
    }
    
    .work-name {
      text-align: left !important;
    }
    
    .block-title-row {
      background: linear-gradient(135deg, #232323 0%, #404040 100%);
      color: white;
    }
    
    .block-title-row td {
      padding: 12px 4px;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      border: none;
    }
    
    .total-row {
      background: linear-gradient(135deg, #EC0267 0%, #ff1a7a 100%);
      color: white;
      font-weight: 600;
    }
    
    .total-row td {
      padding: 12px 4px;
      border: none;
    }
    
    .block-total {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    
    .disclaimer {
      margin-top: 30px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      color: #6b7280;
    }
    
    .signatures-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
    }
    
    .signature-block {
      text-align: center;
    }
    
    .signature-title {
      font-weight: 600;
      margin-bottom: 20px;
      color: #374151;
    }
    
    .signature-line {
      border-bottom: 1px solid #000;
      height: 20px;
      margin-bottom: 5px;
    }
    
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .document {
        max-width: 100%;
        margin: 0;
      }
    }
    
    @page {
      margin: 10mm;
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div class="company-name">Идеальный подрядчик</div>
      <div class="company-motto">Быстро. Четко. Компонентно.</div>
    </div>

    <div class="act-title">
      Акт выполненных работ №${act.id} от ${formattedDate}<br>
      в соответствии с Приложением №2 по договору №${clientData?.contractNumber || ''} от ${clientData?.contractDate ? new Date(clientData.contractDate).toLocaleDateString('ru-RU') : ''}
    </div>

    <div class="works-section">
      <h2 class="section-title">Список выполненных работ</h2>
      <table class="works-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Наименование работ</th>
            <th>Ед. изм.</th>
            <th>Кол-во</th>
            <th>Цена за ед.</th>
            <th>Стоимость</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            const worksData = act.calculatedWorksData || (act.rooms || []);
            let globalItemNumber = 1;
            
            if (!worksData || worksData.length === 0) {
              return '<tr><td colspan="6" style="text-align: center; padding: 40px;">Работы не добавлены</td></tr>';
            }
            
            return worksData.flatMap((block: any) => {
              if (!block.items || block.items.length === 0) return [];
              
              return [
                `<tr class="block-title-row">
                  <td colspan="6">${block.title}</td>
                </tr>`,
                ...block.items.map((item: any) => `
                  <tr>
                    <td class="number">${globalItemNumber++}</td>
                    <td class="work-name">${item.workName || item.name}${item.description ? ` (${item.description})` : ''}</td>
                    <td class="number">${item.unit}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="currency">${(item.displayUnitPrice || item.unitPrice || item.price || 0).toLocaleString('ru-RU')} ₽</td>
                    <td class="currency">${(item.displayTotalPrice || item.totalPrice || 0).toLocaleString('ru-RU')} ₽</td>
                  </tr>
                `),
                `<tr class="block-total">
                  <td colspan="5" style="text-align: right;">Итого по блоку "${block.title}":</td>
                  <td class="currency">${(block.items.reduce((sum: number, item: any) => sum + (item.displayTotalPrice || item.totalPrice), 0)).toLocaleString('ru-RU')} ₽</td>
                </tr>`
              ];
            }).join('');
          })()}
          <tr class="total-row">
            <td colspan="5" style="text-align: right; font-size: 16px;">ИТОГО:</td>
            <td class="currency" style="font-size: 16px;">
              ${(() => {
                if (act.calculatedWorksData) {
                  return act.calculatedWorksData.reduce((total: number, block: any) => {
                    return total + block.items.reduce((blockSum: number, item: any) => blockSum + (item.displayTotalPrice || item.totalPrice), 0);
                  }, 0).toLocaleString('ru-RU');
                }
                return (act.totalWorksPrice || 0).toLocaleString('ru-RU');
              })()} ₽</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="disclaimer">
      Работы, указанные в настоящем акте согласованы заказчиком дополнительно к смете (Приложение №2 к договору).
    </div>
    
    <div class="disclaimer">
      Подписанием настоящего акта Заказчик подтверждает, что работы выполнены в полном объеме и с надлежащим качеством. Претензий относительно качества и объемов работ Заказчик не имеет.
    </div>

    <div class="signatures-section">
      <div class="signature-block">
        <div class="signature-title">Подрядчик</div>
        <div class="signature-line"></div>
      </div>
      <div class="signature-block">
        <div class="signature-title">Заказчик</div>
        <div class="signature-line"></div>
      </div>
    </div>
  </div>
  
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 100);
    });
  </script>
</body>
</html>`
}

export async function generateActWithSettings(act: any, settings: any, clientData: any = null) {
  console.log('=== GENERATE ACT WITH SETTINGS ===')
  
  try {
    // Используем универсальную функцию для получения данных с коэффициентами
    const estimateData = await getEstimateDataWithCoefficients(act)
    
    // Добавляем рассчитанные данные в объект акта для использования в HTML
    act.calculatedWorksData = estimateData.worksData
    act.calculatedMaterialsData = estimateData.materialsData
    act.calculatedTotalWorksPrice = estimateData.totalWorksPrice
    act.calculatedTotalMaterialsPrice = estimateData.totalMaterialsPrice
    act.calculatedGrandTotal = estimateData.grandTotal
    
    console.log('Act data prepared with coefficients:', {
      worksBlocksCount: estimateData.worksData?.length || 0,
      totalWorksPrice: estimateData.totalWorksPrice,
      grandTotal: estimateData.grandTotal
    })
    
  } catch (error) {
    console.error('Error preparing act data with coefficients:', error)
    
    // Fallback: используем базовые данные
    act.calculatedGrandTotal = act.totalWorksPrice
  }
  
  const htmlContent = settings.actType === 'simple' 
    ? generateSimpleActHTML(act, settings, clientData)
    : generateAdditionalActHTML(act, settings, clientData)
  
  // Открываем новое окно для печати
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  }
}

// Функция для форматирования дат в формат «ДД» месяц_прописью ГГГГ
function formatDateForAct(dateString: string): string {
  if (!dateString) return ''
  
  const months = [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'
  ]
  
  // Проверяем формат даты (может быть DD.MM.YYYY или YYYY-MM-DD)
  let day: number, month: number, year: number
  
  if (dateString.includes('.')) {
    const parts = dateString.split('.')
    if (parts.length !== 3) return dateString
    day = parseInt(parts[0])
    month = parseInt(parts[1]) - 1
    year = parseInt(parts[2])
  } else if (dateString.includes('-')) {
    const parts = dateString.split('-')
    if (parts.length !== 3) return dateString
    year = parseInt(parts[0])
    month = parseInt(parts[1]) - 1
    day = parseInt(parts[2])
  } else {
    return dateString
  }
  
  if (isNaN(day) || isNaN(month) || isNaN(year) || month < 0 || month > 11) {
    return dateString
  }
  
  return `«${day}» ${months[month]} ${year}`
}

// Генерация HTML для простого акта (без дополнительных работ)
function generateSimpleActHTML(act: any, settings: any, clientData: any = null): string {
  const formattedActDate = formatDateForAct(settings.actDate)
  const formattedContractDate = formatDateForAct(settings.contractDate)
  
  const contractNumber = settings.isManualContractNumber 
    ? settings.contractNumber 
    : (clientData?.contractNumber || '')
  
  const contractDate = settings.isManualContractDate 
    ? settings.contractDate 
    : (clientData?.contractDate || '')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Акт выполненных работ №${settings.actNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      color: #1a1a1a;
      background: #f9f9f9;
    }
    
    .document {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: #000000;
      color: white;
      text-align: center;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #EC0267;
      margin-bottom: 5px;
    }
    
    .company-motto {
      font-size: 12px;
      font-weight: 400;
      color: white;
    }
    
    .act-title {
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    
    .works-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #232323;
      margin-bottom: 20px;
    }
    
    .works-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      max-width: 100%;
    }
    
    .works-table th,
    .works-table td {
      padding: 8px 4px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .works-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
      text-align: center;
    }
    
    .works-table tr:hover:not(.total-row):not(.block-total):not(.block-title-row) {
      background: #f9fafb;
    }
    
    .works-table td:nth-child(1) {
      width: 30px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(2) {
      width: 400px !important;
      text-align: left !important;
    }
    
    .works-table td:nth-child(3) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(4) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(5) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .works-table td:nth-child(6) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .number {
      text-align: center !important;
    }
    
    .currency {
      text-align: right !important;
    }
    
    .work-name {
      text-align: left !important;
    }
    
    .block-title-row {
      background: linear-gradient(135deg, #232323 0%, #404040 100%);
      color: white;
    }
    
    .block-title-row td {
      padding: 12px 4px;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      border: none;
    }
    
    .total-row {
      background: linear-gradient(135deg, #EC0267 0%, #ff1a7a 100%);
      color: white;
      font-weight: 600;
    }
    
    .total-row td {
      padding: 12px 4px;
      border: none;
    }
    
    .block-total {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    
    .disclaimer {
      margin-top: 30px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      color: #6b7280;
    }
    
    .signatures-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
    }
    
    .signature-block {
      text-align: center;
    }
    
    .signature-title {
      font-weight: 600;
      margin-bottom: 20px;
      color: #374151;
    }
    
    .signature-line {
      border-bottom: 1px solid #000;
      height: 20px;
      margin-bottom: 5px;
    }
    
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .document {
        max-width: 100%;
        margin: 0;
      }
    }
    
    @page {
      margin: 10mm;
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div class="company-name">Идеальный подрядчик</div>
      <div class="company-motto">Быстро. Четко. Компонентно.</div>
    </div>

    <div class="act-title">
      Акт выполненных работ №${settings.actNumber} от ${formattedActDate}<br>
      в соответствии с Приложением №2 по договору №${contractNumber} от ${formatDateForAct(contractDate)}
    </div>

    <div class="works-section">
      <h2 class="section-title">Список выполненных работ</h2>
      <table class="works-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Наименование работ</th>
            <th>Ед. изм.</th>
            <th>Кол-во</th>
            <th>Цена за ед.</th>
            <th>Стоимость</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            const worksData = act.calculatedWorksData || (act.rooms || []);
            let globalItemNumber = 1;
            
            if (!worksData || worksData.length === 0) {
              return '<tr><td colspan="6" style="text-align: center; padding: 40px;">Работы не добавлены</td></tr>';
            }
            
            return worksData.flatMap((block: any) => {
              if (!block.items || block.items.length === 0) return [];
              
              return [
                `<tr class="block-title-row">
                  <td colspan="6">${block.title}</td>
                </tr>`,
                ...block.items.map((item: any) => `
                  <tr>
                    <td class="number">${globalItemNumber++}</td>
                    <td class="work-name">${item.workName || item.name}${item.description ? ` (${item.description})` : ''}</td>
                    <td class="number">${item.unit}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="currency">${(item.displayUnitPrice || item.unitPrice || item.price || 0).toLocaleString('ru-RU')} ₽</td>
                    <td class="currency">${(item.displayTotalPrice || item.totalPrice || 0).toLocaleString('ru-RU')} ₽</td>
                  </tr>
                `),
                `<tr class="block-total">
                  <td colspan="5" style="text-align: right;">Итого по блоку "${block.title}":</td>
                  <td class="currency">${(block.items.reduce((sum: number, item: any) => sum + (item.displayTotalPrice || item.totalPrice), 0)).toLocaleString('ru-RU')} ₽</td>
                </tr>`
              ];
            }).join('');
          })()}
          <tr class="total-row">
            <td colspan="5" style="text-align: right; font-size: 16px;">ИТОГО:</td>
            <td class="currency" style="font-size: 16px;">
              ${(() => {
                if (act.calculatedWorksData) {
                  return act.calculatedWorksData.reduce((total: number, block: any) => {
                    return total + block.items.reduce((blockSum: number, item: any) => blockSum + (item.displayTotalPrice || item.totalPrice), 0);
                  }, 0).toLocaleString('ru-RU');
                }
                return (act.totalWorksPrice || 0).toLocaleString('ru-RU');
              })()} ₽</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="disclaimer">
      Работы, указанные в настоящем акте согласованы заказчиком дополнительно к смете (Приложение №2 к договору).
    </div>
    
    <div class="disclaimer">
      Подписанием настоящего акта Заказчик подтверждает, что работы выполнены в полном объеме и с надлежащим качеством. Претензий относительно качества и объемов работ Заказчик не имеет.
    </div>

    <div class="signatures-section">
      <div class="signature-block">
        <div class="signature-title">Подрядчик</div>
        <div class="signature-line"></div>
      </div>
      <div class="signature-block">
        <div class="signature-title">Заказчик</div>
        <div class="signature-line"></div>
      </div>
    </div>
  </div>
  
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 100);
    });
  </script>
</body>
</html>`
}

// Генерация HTML для дополнительного акта
function generateAdditionalActHTML(act: any, settings: any, clientData: any = null): string {
  const formattedActDate = formatDateForAct(settings.actDate)
  const formattedContractDate = formatDateForAct(settings.contractDate)
  
  const contractNumber = settings.isManualContractNumber 
    ? settings.contractNumber 
    : (clientData?.contractNumber || '')
  
  const contractDate = settings.isManualContractDate 
    ? settings.contractDate 
    : (clientData?.contractDate || '')

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="robots" content="noindex">
  <title>Акт выполненных работ №${settings.actNumber}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&display=swap');
    
    body {
      font-family: 'Manrope', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      margin: 0;
      padding: 20px;
      color: #1a1a1a;
      background: #f9f9f9;
    }
    
    .document {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 40px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: #000000;
      color: white;
      text-align: center;
      padding: 20px;
      margin-bottom: 30px;
    }
    
    .company-name {
      font-size: 24px;
      font-weight: 700;
      color: #EC0267;
      margin-bottom: 5px;
    }
    
    .company-motto {
      font-size: 12px;
      font-weight: 400;
      color: white;
    }
    
    .act-title {
      font-size: 18px;
      font-weight: 600;
      text-align: center;
      margin-bottom: 30px;
      line-height: 1.5;
    }
    
    .works-section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: #232323;
      margin-bottom: 20px;
    }
    
    .works-table {
      width: 100%;
      table-layout: fixed;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
      max-width: 100%;
    }
    
    .works-table th,
    .works-table td {
      padding: 8px 4px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
      font-size: 12px;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .works-table th {
      background: #f8fafc;
      font-weight: 600;
      color: #374151;
      text-align: center;
    }
    
    .works-table tr:hover:not(.total-row):not(.block-total):not(.block-title-row) {
      background: #f9fafb;
    }
    
    .works-table td:nth-child(1) {
      width: 30px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(2) {
      width: 400px !important;
      text-align: left !important;
    }
    
    .works-table td:nth-child(3) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(4) {
      width: 50px !important;
      text-align: center !important;
    }
    
    .works-table td:nth-child(5) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .works-table td:nth-child(6) {
      width: 80px !important;
      text-align: right !important;
    }
    
    .number {
      text-align: center !important;
    }
    
    .currency {
      text-align: right !important;
    }
    
    .work-name {
      text-align: left !important;
    }
    
    .block-title-row {
      background: linear-gradient(135deg, #232323 0%, #404040 100%);
      color: white;
    }
    
    .block-title-row td {
      padding: 12px 4px;
      font-weight: 600;
      font-size: 13px;
      text-align: center;
      border: none;
    }
    
    .total-row {
      background: linear-gradient(135deg, #EC0267 0%, #ff1a7a 100%);
      color: white;
      font-weight: 600;
    }
    
    .total-row td {
      padding: 12px 4px;
      border: none;
    }
    
    .block-total {
      background: #f3f4f6;
      font-weight: 600;
      color: #374151;
    }
    
    .disclaimer {
      margin-top: 30px;
      padding: 15px;
      background: #f8fafc;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.5;
      color: #6b7280;
    }
    
    .signatures-section {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 50px;
    }
    
    .signature-block {
      text-align: center;
    }
    
    .signature-title {
      font-weight: 600;
      margin-bottom: 20px;
      color: #374151;
    }
    
    .signature-line {
      border-bottom: 1px solid #000;
      height: 20px;
      margin-bottom: 5px;
    }
    
    @media print {
      body {
        padding: 0;
        margin: 0;
      }
      .document {
        max-width: 100%;
        margin: 0;
      }
    }
    
    @page {
      margin: 10mm;
    }
  </style>
</head>
<body>
  <div class="document">
    <div class="header">
      <div class="company-name">Идеальный подрядчик</div>
      <div class="company-motto">Быстро. Четко. Компонентно.</div>
    </div>

    <div class="act-title">
      Акт выполненных работ №${settings.actNumber} от ${formattedActDate}<br>
      в соответствии с Приложением №2 по договору №${contractNumber} от ${formatDateForAct(contractDate)}
    </div>

    <div class="works-section">
      <h2 class="section-title">Список выполненных работ</h2>
      <table class="works-table">
        <thead>
          <tr>
            <th>№</th>
            <th>Наименование работ</th>
            <th>Ед. изм.</th>
            <th>Кол-во</th>
            <th>Цена за ед.</th>
            <th>Стоимость</th>
          </tr>
        </thead>
        <tbody>
          ${(() => {
            const worksData = act.calculatedWorksData || (act.rooms || []);
            let globalItemNumber = 1;
            
            if (!worksData || worksData.length === 0) {
              return '<tr><td colspan="6" style="text-align: center; padding: 40px;">Работы не добавлены</td></tr>';
            }
            
            return worksData.flatMap((block: any) => {
              if (!block.items || block.items.length === 0) return [];
              
              return [
                `<tr class="block-title-row">
                  <td colspan="6">${block.title}</td>
                </tr>`,
                ...block.items.map((item: any) => `
                  <tr>
                    <td class="number">${globalItemNumber++}</td>
                    <td class="work-name">${item.workName || item.name}${item.description ? ` (${item.description})` : ''}</td>
                    <td class="number">${item.unit}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="currency">${(item.displayUnitPrice || item.unitPrice || item.price || 0).toLocaleString('ru-RU')} ₽</td>
                    <td class="currency">${(item.displayTotalPrice || item.totalPrice || 0).toLocaleString('ru-RU')} ₽</td>
                  </tr>
                `),
                `<tr class="block-total">
                  <td colspan="5" style="text-align: right;">Итого по блоку "${block.title}":</td>
                  <td class="currency">${(block.items.reduce((sum: number, item: any) => sum + (item.displayTotalPrice || item.totalPrice), 0)).toLocaleString('ru-RU')} ₽</td>
                </tr>`
              ];
            }).join('');
          })()}
          <tr class="total-row">
            <td colspan="5" style="text-align: right; font-size: 16px;">ИТОГО:</td>
            <td class="currency" style="font-size: 16px;">
              ${(() => {
                if (act.calculatedWorksData) {
                  return act.calculatedWorksData.reduce((total: number, block: any) => {
                    return total + block.items.reduce((blockSum: number, item: any) => blockSum + (item.displayTotalPrice || item.totalPrice), 0);
                  }, 0).toLocaleString('ru-RU');
                }
                return (act.totalWorksPrice || 0).toLocaleString('ru-RU');
              })()} ₽</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="disclaimer">
      Работы, указанные в настоящем акте согласованы заказчиком дополнительно к смете (Приложение №2 к договору).
    </div>
    
    <div class="disclaimer">
      Подписанием настоящего акта Заказчик подтверждает, что работы выполнены в полном объеме и с надлежащим качеством. Претензий относительно качества и объемов работ Заказчик не имеет.
    </div>

    <div class="signatures-section">
      <div class="signature-block">
        <div class="signature-title">Подрядчик</div>
        <div class="signature-line"></div>
      </div>
      <div class="signature-block">
        <div class="signature-title">Заказчик</div>
        <div class="signature-line"></div>
      </div>
    </div>
  </div>
  
  <script>
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 100);
    });
  </script>
</body>
</html>`
}

// Универсальная функция для получения данных сметы с коэффициентами
export async function getEstimateDataWithCoefficients(estimate: any): Promise<any> {
  console.log('=== GETTING ESTIMATE DATA WITH COEFFICIENTS ===')
  console.log('Estimate:', {
    id: estimate.id,
    title: estimate.title,
    type: estimate.type,
    category: estimate.category,
    isAct: estimate.isAct
  })

  try {
    // Всегда создаем свежий кеш при экспорте для актуальных данных
    console.log('Creating fresh cache with coefficients...')
    
    // Получаем все коэффициенты из системы
    const coefficientsResponse = await fetch('/api/coefficients')
    const allCoefficients = coefficientsResponse.ok ? (await coefficientsResponse.json()).coefficients : []
    
    // Определяем тип документа и используем соответствующую функцию расчета
    let calculatedPrices;
    
    if (estimate.isAct) {
      // Для актов используем функцию основных смет (акты основаны на сметах)
      calculatedPrices = calculateMainEstimatePrices(estimate, allCoefficients)
    } else if (estimate.category === 'additional') {
      // Для дополнительных смет
      calculatedPrices = calculateAdditionalEstimatePrices(estimate, allCoefficients)
    } else {
      // Для основных смет
      calculatedPrices = calculateMainEstimatePrices(estimate, allCoefficients)
    }
    
    // Сохраняем кеш экспорта
    const cacheResponse = await fetch(`/api/estimates/${estimate.id}/export-cache`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        worksData: JSON.stringify(calculatedPrices.worksData),
        materialsData: JSON.stringify(calculatedPrices.materialsData),
        totalWorksPrice: calculatedPrices.totalWorksPrice,
        totalMaterialsPrice: calculatedPrices.totalMaterialsPrice,
        grandTotal: calculatedPrices.grandTotal,
        coefficientsInfo: JSON.stringify(calculatedPrices.coefficientsInfo)
      })
    })
    
    if (!cacheResponse.ok) {
      console.warn('Failed to save cache, but continuing with calculated data')
    } else {
      console.log('Fresh cache created successfully with coefficients')
    }
    
    return calculatedPrices
    
  } catch (error) {
    console.error('Error getting estimate data with coefficients:', error)
    
    // Fallback: используем базовые цены без коэффициентов
    console.log('Using fallback - base prices without coefficients')
    return {
      worksData: estimate.worksBlock?.blocks || estimate.summaryWorksBlock?.blocks || [],
      materialsData: estimate.materialsBlock?.items || estimate.summaryMaterialsBlock?.items || [],
      totalWorksPrice: estimate.totalWorksPrice,
      totalMaterialsPrice: estimate.totalMaterialsPrice,
      grandTotal: estimate.totalPrice,
      coefficientsInfo: null
    }
  }
}