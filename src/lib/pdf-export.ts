import { Estimate } from '@/types/estimate'

export function generateEstimatePDF(estimate: Estimate, coefficients: any[] = [], clientData: any = null) {
  const htmlContent = generateEstimateHTML(estimate, coefficients, clientData)
  
  // Открываем новое окно для печати
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    // Печать запускается автоматически через JavaScript в HTML
  }
}

export function downloadEstimateHTML(estimate: Estimate, coefficients: any[] = [], clientData: any = null) {
  const htmlContent = generateEstimateHTML(estimate, coefficients, clientData)
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `смета_${estimate.title}_${new Date().toISOString().split('T')[0]}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

function calculateEstimatePrices(estimate: Estimate, coefficients: any[]) {
  // Для смет по помещениям используем summaryWorksBlock, для квартир - worksBlock
  const hasWorksBlock = (estimate.type === 'rooms' && estimate.summaryWorksBlock) || 
                       (estimate.type === 'apartment' && estimate.worksBlock)
  const hasMaterialsBlock = (estimate.type === 'rooms' && estimate.summaryMaterialsBlock) || 
                           (estimate.type === 'apartment' && estimate.materialsBlock)
  
  if (hasWorksBlock && hasMaterialsBlock && coefficients.length > 0) {
    const estimateCoefficients = estimate.coefficients || []
    const manualPrices = new Set(estimate.manualPrices || [])
    
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
    
    // Пересчитываем работы с коэффициентами
    const worksBlock = estimate.type === 'rooms' ? estimate.summaryWorksBlock : estimate.worksBlock
    const adjustedWorksData = worksBlock!.blocks.map(block => ({
      ...block,
      items: block.items.map(item => {
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
    
    // Материалы с глобальным коэффициентом
    const globalCoeff = normalCoeff * finalCoeff
    const materialsBlock = estimate.type === 'rooms' ? estimate.summaryMaterialsBlock : estimate.materialsBlock
    const adjustedMaterialsData = materialsBlock!.items.map(item => ({
      ...item,
      displayUnitPrice: Math.round(item.unitPrice * globalCoeff),
      displayTotalPrice: Math.round(item.unitPrice * globalCoeff * item.quantity),
      coefficientsApplied: `Глобальные: ${globalCoeff}`
    }))
    
    const totalMaterialsPrice = adjustedMaterialsData.reduce((sum, item) => sum + item.displayTotalPrice, 0)
    
    return {
      worksData: adjustedWorksData,
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
    
    return {
      worksData: worksData.map(block => ({
        ...block,
        items: block.items.map(item => ({
          ...item,
          displayUnitPrice: item.unitPrice,
          displayTotalPrice: item.totalPrice,
          coefficientsApplied: 'Без коэффициентов'
        }))
      })),
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

function generateEstimateHTML(estimate: Estimate, coefficients: any[] = [], clientData: any = null): string {
  const prices = calculateEstimatePrices(estimate, coefficients)
  
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
      padding: 20px;
    }
    
    .client-section {
      background: linear-gradient(135deg, #EC0267 0%, #ff1a7a 100%);
      color: white;
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
      background: rgba(255,255,255,0.2);
      padding: 10px;
      border-radius: 6px;
      text-align: center;
      font-weight: 500;
      font-size: 13px;
    }

    .estimate-section {
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
      color: white;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .estimate-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
    }

    .estimate-details {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
      font-size: 13px;
    }

    .estimate-detail-item {
      display: flex;
      align-items: center;
    }

    .estimate-detail-label {
      font-weight: 500;
      margin-right: 8px;
    }
    
    .estimate-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 25px;
    }
    
    .info-card {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #EC0267;
      text-align: center;
    }
    
    .info-label {
      font-size: 11px;
      color: #6b7280;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }
    
    .info-value {
      font-size: 13px;
      font-weight: 600;
      color: #232323;
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
      padding: 15px 8px;
      font-weight: 600;
      font-size: 14px;
      text-align: center;
      border: none;
    }
    
    .works-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
    }
    
    .works-table th {
      background: linear-gradient(135deg, #232323 0%, #404040 100%);
      color: white;
      padding: 12px 8px;
      text-align: center;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .works-table td {
      padding: 12px 8px;
      border-bottom: 1px solid #e5e7eb;
      font-size: 13px;
    }
    
    .works-table tr:nth-child(even):not(.total-row):not(.block-total):not(.block-title-row) {
      background: #f9fafb;
    }
    
    .works-table tr:hover:not(.total-row):not(.block-total):not(.block-title-row) {
      background: #f3f4f6;
    }
    
    .total-row:hover,
    .block-total:hover {
      background: inherit !important;
    }
    
    .number {
      text-align: center;
      font-weight: 600;
      color: #232323;
    }
    
    .currency {
      text-align: right;
      font-weight: 600;
      color: #EC0267;
    }
    
    .work-name {
      font-weight: 500;
      color: #232323;
    }
    
    .total-row {
      background: linear-gradient(135deg, #EC0267 0%, #ff1a7a 100%) !important;
      color: white !important;
      font-weight: 600;
    }
    
    .total-row td {
      background: transparent !important;
      color: white !important;
      border: none;
      padding: 15px 8px;
    }
    
    .block-total {
      background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%) !important;
      color: white !important;
      font-weight: 600;
    }
    
    .block-total td {
      background: transparent !important;
      color: white !important;
      border: none;
      padding: 12px 8px;
    }
    
    .grand-total {
      background: linear-gradient(135deg, #232323 0%, #404040 100%);
      color: white;
      padding: 25px;
      border-radius: 10px;
      text-align: center;
      margin: 30px 0;
    }
    
    .grand-total-amount {
      font-size: 28px;
      font-weight: 700;
      margin-top: 10px;
    }
    
    .footer {
      background: #f9fafb;
      padding: 20px;
      text-align: center;
      color: #6b7280;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
    }
    
    @media print {
      body { 
        background: white; 
        padding: 0;
      }
      .document {
        box-shadow: none;
        border-radius: 0;
      }
    }
    
    @page {
      margin: 15mm;
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
        <div class="client-name">${clientData.name || 'Клиент'}</div>
        <div class="client-info">
          ${clientData.phone ? `<div class="client-info-item">📞 ${clientData.phone}</div>` : ''}
          ${clientData.email ? `<div class="client-info-item">✉️ ${clientData.email}</div>` : ''}
        </div>
        ${clientData.contractNumber ? `
        <div class="contract-info">
          Приложение №2 к договору №${clientData.contractNumber}
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="estimate-section">
        <div class="estimate-title">${estimate.title}</div>
        <div class="estimate-details">
          <div class="estimate-detail-item">
            <span class="estimate-detail-label">Тип сметы:</span>
            <span>${estimate.category === 'main' ? 'Основная смета' : 'Дополнительные работы'}</span>
          </div>
          <div class="estimate-detail-item">
            <span class="estimate-detail-label">Структура:</span>
            <span>${estimate.type === 'apartment' ? 'По всей квартире' : 'По помещениям'}</span>
          </div>
        </div>
      </div>

      <div class="estimate-info">
        <div class="info-card">
          <div class="info-label">Дата создания</div>
          <div class="info-value">${new Date(estimate.createdAt).toLocaleDateString('ru-RU')}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Последнее изменение</div>
          <div class="info-value">${new Date(estimate.updatedAt).toLocaleDateString('ru-RU')}</div>
        </div>
        <div class="info-card">
          <div class="info-label">Дата печати</div>
          <div class="info-value">${new Date().toLocaleDateString('ru-RU')}</div>
        </div>
      </div>

      <div class="works-section">
        <h2 class="section-title">Ремонтные работы</h2>
        <table class="works-table">
          <thead>
            <tr>
              <th style="width: 50px">№</th>
              <th style="width: 400px">Наименование работ</th>
              <th style="width: 80px">Ед. изм.</th>
              <th style="width: 80px">Кол-во</th>
              <th style="width: 100px">Цена за ед.</th>
              <th style="width: 120px">Стоимость</th>
            </tr>
          </thead>
          <tbody>
            ${prices.worksData.flatMap((block, blockIndex) => {
              let itemNumber = 1;
              return [
                `<tr class="block-title-row">
                  <td colspan="6">${block.title}</td>
                </tr>`,
                ...block.items.map((item) => `
                  <tr>
                    <td class="number">${itemNumber++}</td>
                    <td class="work-name">${item.name}</td>
                    <td class="number">${item.unit}</td>
                    <td class="number">${item.quantity}</td>
                    <td class="currency">${item.displayUnitPrice.toLocaleString('ru-RU')} ₽</td>
                    <td class="currency">${item.displayTotalPrice.toLocaleString('ru-RU')} ₽</td>
                  </tr>
                `),
                `<tr class="block-total">
                  <td colspan="5" style="text-align: right;">Итого по блоку "${block.title}":</td>
                  <td class="currency">${block.items.reduce((sum, item) => sum + item.displayTotalPrice, 0).toLocaleString('ru-RU')} ₽</td>
                </tr>`
              ]
            }).join('') || '<tr><td colspan="6" style="text-align: center; padding: 40px;">Работы не добавлены</td></tr>'}
            <tr class="total-row">
              <td colspan="5" style="text-align: right; font-size: 16px;">ИТОГО:</td>
              <td class="currency" style="font-size: 16px;">${prices.totalWorksPrice.toLocaleString('ru-RU')} ₽</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grand-total">
        <div style="font-size: 18px; font-weight: 500;">Общая стоимость работ</div>
        <div class="grand-total-amount">${prices.totalWorksPrice.toLocaleString('ru-RU')} ₽</div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Идеальный подрядчик</strong> - Ваш надежный партнер в ремонте</p>
      <p>Документ сгенерирован ${new Date().toLocaleDateString('ru-RU')} в ${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</p>
    </div>
  </div>
  
  <script>
    // Скрываем URL в заголовке при печати
    window.addEventListener('beforeprint', function() {
      document.title = 'Смета - ${estimate.title}';
    });
    
    // Автоматически запускаем печать при загрузке
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 100);
    });
  </script>
</body>
</html>`
} 