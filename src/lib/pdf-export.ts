import { Estimate } from '@/types/estimate'

export function generateEstimatePDF(estimate: Estimate) {
  // Создаем HTML контент для PDF
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Смета - ${estimate.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #3b82f6;
          padding-bottom: 20px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 10px;
        }
        .estimate-title {
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .client-info {
          background: #f8fafc;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .client-info h3 {
          margin-top: 0;
          color: #3b82f6;
        }
        .section {
          margin-bottom: 30px;
        }
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #3b82f6;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #e2e8f0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th, td {
          border: 1px solid #e2e8f0;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        .number {
          text-align: right;
        }
        .total-row {
          font-weight: bold;
          background-color: #f8fafc;
        }
        .grand-total {
          background: #3b82f6;
          color: white;
          padding: 15px;
          border-radius: 8px;
          text-align: center;
          font-size: 18px;
          font-weight: bold;
          margin-top: 20px;
        }
        .footer {
          margin-top: 40px;
          text-align: center;
          color: #64748b;
          font-size: 12px;
        }
        .date {
          text-align: right;
          color: #64748b;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">AEY</div>
        <div>Профессиональные ремонтные работы</div>
      </div>

      <div class="date">
        Дата создания: ${estimate.createdAt.toLocaleDateString('ru-RU')}
      </div>

      <h1 class="estimate-title">${estimate.title}</h1>

      <div class="client-info">
        <h3>Информация о клиенте</h3>
        <p><strong>ФИО:</strong> ${estimate.client.name}</p>
        <p><strong>Телефон:</strong> ${estimate.client.phone}</p>
        ${estimate.client.email ? `<p><strong>Email:</strong> ${estimate.client.email}</p>` : ''}
        ${estimate.client.address ? `<p><strong>Адрес объекта:</strong> ${estimate.client.address}</p>` : ''}
      </div>

      <div class="section">
        <h2 class="section-title">Работы</h2>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Наименование работ</th>
              <th>Ед. изм.</th>
              <th>Количество</th>
              <th>Цена за ед.</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${estimate.worksBlock.blocks.flatMap(block => 
              block.items.map((item, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${item.name}</td>
                  <td>${item.unit}</td>
                  <td class="number">${item.quantity}</td>
                  <td class="number">${item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                  <td class="number">${item.totalPrice.toLocaleString('ru-RU')} ₽</td>
                </tr>
              `)
            ).join('')}
            <tr class="total-row">
              <td colspan="5"><strong>Итого работы:</strong></td>
              <td class="number"><strong>${estimate.totalWorksPrice.toLocaleString('ru-RU')} ₽</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2 class="section-title">Материалы</h2>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Наименование материалов</th>
              <th>Ед. изм.</th>
              <th>Количество</th>
              <th>Цена за ед.</th>
              <th>Сумма</th>
            </tr>
          </thead>
          <tbody>
            ${estimate.materialsBlock.items.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.unit}</td>
                <td class="number">${item.quantity}</td>
                <td class="number">${item.unitPrice.toLocaleString('ru-RU')} ₽</td>
                <td class="number">${item.totalPrice.toLocaleString('ru-RU')} ₽</td>
              </tr>
            `).join('')}
            <tr class="total-row">
              <td colspan="5"><strong>Итого материалы:</strong></td>
              <td class="number"><strong>${estimate.totalMaterialsPrice.toLocaleString('ru-RU')} ₽</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="grand-total">
        ОБЩАЯ СТОИМОСТЬ: ${estimate.totalPrice.toLocaleString('ru-RU')} ₽
      </div>

      ${estimate.notes ? `
        <div class="section">
          <h3>Примечания</h3>
          <p>${estimate.notes}</p>
        </div>
      ` : ''}

      <div class="footer">
        <p>Смета сгенерирована в системе AEY Estimates</p>
        <p>Дата печати: ${new Date().toLocaleDateString('ru-RU')}</p>
      </div>
    </body>
    </html>
  `

  // Открываем новое окно для печати
  const printWindow = window.open('', '_blank')
  if (printWindow) {
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // Ждем загрузки и запускаем печать
    printWindow.onload = () => {
      printWindow.print()
    }
  }
}

export function downloadEstimateHTML(estimate: Estimate) {
  const htmlContent = generateEstimateHTML(estimate)
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

function generateEstimateHTML(estimate: Estimate): string {
  // Тот же HTML контент что и для PDF, но без автопечати
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Смета - ${estimate.title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
    .company-name { font-size: 24px; font-weight: bold; color: #3b82f6; margin-bottom: 10px; }
    .estimate-title { font-size: 20px; font-weight: bold; margin-bottom: 20px; }
    .client-info { background: #f8fafc; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
    .client-info h3 { margin-top: 0; color: #3b82f6; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 18px; font-weight: bold; color: #3b82f6; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #e2e8f0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
    th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; }
    th { background-color: #f1f5f9; font-weight: bold; }
    .number { text-align: right; }
    .total-row { font-weight: bold; background-color: #f8fafc; }
    .grand-total { background: #3b82f6; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: bold; margin-top: 20px; }
    .footer { margin-top: 40px; text-align: center; color: #64748b; font-size: 12px; }
    .date { text-align: right; color: #64748b; margin-bottom: 20px; }
  </style>
</head>
<body>
  <!-- Здесь будет тот же контент что и в generateEstimatePDF -->
</body>
</html>`
} 