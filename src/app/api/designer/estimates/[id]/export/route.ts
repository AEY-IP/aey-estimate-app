import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth } from '@/lib/auth'
import { getSignedDownloadUrl } from '@/lib/storage'

export const dynamic = 'force-dynamic'
// import puppeteer from 'puppeteer'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const estimate = await prisma.designer_estimates.findUnique({
      where: { id: params.id },
      include: {
        designer_clients: true,
        users: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        designer_estimate_blocks: {
          where: { isActive: true },
          include: {
            designer_estimate_items: {
              orderBy: { sortOrder: 'asc' }
            },
            designer_estimate_blocks: true
          },
          orderBy: { sortOrder: 'asc' }
        }
      }
    })

    if (!estimate || !estimate.isActive) {
      return NextResponse.json({ error: 'Смета не найдена' }, { status: 404 })
    }

    if (session.role === 'DESIGNER' && estimate.designerId !== session.id) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    if (session.role !== 'ADMIN' && session.role !== 'DESIGNER') {
      return NextResponse.json({ error: 'Недостаточно прав' }, { status: 403 })
    }

    // Получаем параметры экспорта
    const url = new URL(request.url)
    const format = url.searchParams.get('format')
    const orientation = url.searchParams.get('orientation') || 'portrait'
    const primaryColor = url.searchParams.get('color') || '#7c3aed'

    // Функция для генерации оттенков цвета
    function hexToRgb(hex: string): { r: number, g: number, b: number } {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 124, g: 58, b: 237 }
    }

    function rgbToHex(r: number, g: number, b: number): string {
      return '#' + [r, g, b].map(x => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
        return hex.length === 1 ? '0' + hex : hex
      }).join('')
    }

    function generateColorShades(baseColor: string) {
      const rgb = hexToRgb(baseColor)
      
      // Светлые оттенки для фонов блоков разных уровней
      const light1 = rgbToHex(
        rgb.r + (255 - rgb.r) * 0.9,
        rgb.g + (255 - rgb.g) * 0.9,
        rgb.b + (255 - rgb.b) * 0.9
      )
      const light2 = rgbToHex(
        rgb.r + (255 - rgb.r) * 0.85,
        rgb.g + (255 - rgb.g) * 0.85,
        rgb.b + (255 - rgb.b) * 0.85
      )
      const light3 = rgbToHex(
        rgb.r + (255 - rgb.r) * 0.8,
        rgb.g + (255 - rgb.g) * 0.8,
        rgb.b + (255 - rgb.b) * 0.8
      )
      
      // Темный оттенок для градиента
      const dark = rgbToHex(
        rgb.r * 0.7,
        rgb.g * 0.7,
        rgb.b * 0.7
      )

      return { primary: baseColor, light1, light2, light3, dark }
    }

    const colors = generateColorShades(primaryColor)

    // Генерируем signed URLs для всех изображений
    const itemsWithImages = await Promise.all(
      estimate.designer_estimate_blocks.flatMap(block => 
        block.designer_estimate_items.map(async (item: any) => {
          if (item.imageUrl && !item.imageUrl.startsWith('http')) {
            return {
              ...item,
              imageUrl: await getSignedDownloadUrl(item.imageUrl, 7200)
            }
          }
          return item
        })
      )
    )

    // Обновляем items в блоках с signed URLs
    const itemsMap = new Map(itemsWithImages.map(item => [item.id, item]))
    estimate.designer_estimate_blocks.forEach((block: any) => {
      block.designer_estimate_items = block.designer_estimate_items.map((item: any) => itemsMap.get(item.id) || item)
    })

    // Рекурсивный подсчет стоимости блока с учетом дочерних
    function calculateBlockTotal(block: any): number {
      const ownItemsTotal = block.designer_estimate_items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
      const children = estimate.designer_estimate_blocks.filter((b: any) => b.parentId === block.id)
      const childrenTotal = children.reduce((sum: number, child: any) => sum + calculateBlockTotal(child), 0)
      return ownItemsTotal + childrenTotal
    }

    // Счетчики для нумерации блоков
    const blockCounters: { [key: string]: number } = {}
    
    function getBlockNumber(block: any, parentNumber: string = ''): string {
      if (!block.parentId) {
        // Корневой блок
        if (!blockCounters['root']) blockCounters['root'] = 0
        blockCounters['root']++
        return `${blockCounters['root']}`
      } else {
        // Дочерний блок
        const key = `parent_${block.parentId}`
        if (!blockCounters[key]) blockCounters[key] = 0
        blockCounters[key]++
        return `${parentNumber}.${blockCounters[key]}`
      }
    }

    function renderBlockHTML(block: any, level: number = 1, parentNumber: string = '', fontSize: number = 20): string {
      const ownItemsTotal = block.designer_estimate_items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
      const children = estimate.designer_estimate_blocks.filter((b: any) => b.parentId === block.id)
      const childrenTotal = children.reduce((sum: number, child: any) => sum + calculateBlockTotal(child), 0)
      const blockTotal = ownItemsTotal + childrenTotal

      const blockNumber = getBlockNumber(block, parentNumber)
      
      const bgColors = [colors.light1, colors.light2, colors.light3, colors.light1]
      const bgColor = bgColors[(level - 1) % bgColors.length]
      
      const borderWidths = ['5px', '4px', '3px', '3px']
      const borderWidth = borderWidths[(level - 1) % borderWidths.length]

      let html = `
        <div class="block-wrapper" style="margin-bottom: 15px; margin-left: ${(level - 1) * 25}px; position: relative;">
      `
      
      html += `
          <div class="block-header-box" style="background: ${bgColor}; padding: 14px; border-left: ${borderWidth} solid ${colors.primary}; margin-bottom: 10px; border-radius: 8px; page-break-inside: avoid; page-break-after: avoid;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top;">
                  <div>
                    <span style="background: ${colors.primary}; color: white; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 700; font-family: 'Courier New', monospace; min-width: 50px; text-align: center; display: inline-block; vertical-align: middle;">${blockNumber}</span>
                    <h${level + 1} style="margin: 0; font-size: ${22 - level * 2}px; color: #1f2937; font-weight: 700; display: inline; vertical-align: middle; padding-left: 8px;">
                      ${block.name}
                    </h${level + 1}>
                  </div>
                  ${block.description ? `<p style="color: #6b7280; margin: 8px 0 0 0; font-size: 14px;">${block.description}</p>` : ''}
                </td>
                ${blockTotal > 0 ? `
                  <td style="vertical-align: top; width: 140px; text-align: right;">
                    <div style="padding: 12px 16px; background: white; border-radius: 8px;">
                      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Итого</div>
                      <div style="font-size: ${fontSize}px; font-weight: 700; color: ${colors.primary}; line-height: 1;">
                        ${blockTotal.toLocaleString('ru-RU')} ₽
                      </div>
                    </div>
                  </td>
                ` : ''}
              </tr>
            </table>
          </div>
      `

      if (block.designer_estimate_items && block.designer_estimate_items.length > 0) {
        html += '<div class="items-container" style="margin-bottom: 12px; page-break-before: avoid;">'
        
        block.designer_estimate_items.forEach((item: any, idx: number) => {
          const itemNumber = `${blockNumber}.${idx + 1}`
          
          html += `
            <div class="item-card-wrapper" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 10px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  ${item.imageUrl ? `
                    <td style="vertical-align: top; width: 150px; padding-right: 12px;">
                      <img src="${item.imageUrl}" alt="${item.name}" style="width: 137px; height: 137px; object-fit: cover; border-radius: 8px; border: 3px solid ${colors.light2}; display: block;" />
                    </td>
                  ` : ''}
                  <td style="vertical-align: top;">
                    <div>
                      <span style="background: ${colors.primary}; color: white; padding: 5px 10px; border-radius: 4px; font-size: 11px; font-weight: 700; line-height: 1; font-family: 'Courier New', monospace; min-width: 55px; text-align: center; display: inline-block; vertical-align: middle;">${itemNumber}</span>
                      <span style="font-weight: 600; font-size: 15px; color: #111827; display: inline; vertical-align: middle; padding-left: 8px;">
                        ${item.name}
                      </span>
                    </div>
                    ${item.manufacturer ? `
                      <div style="color: #6b7280; font-size: 13px; margin-top: 6px; padding-left: 8px; border-left: 3px solid ${colors.light2};">
                        <strong>Производитель:</strong> ${item.manufacturer}
                      </div>
                    ` : ''}
                    ${item.link ? `
                      <div style="margin-top: 6px;">
                        <a href="${item.link}" style="color: ${colors.primary}; text-decoration: none; font-size: 12px; padding: 4px 8px; background: ${colors.light1}; border-radius: 4px; display: inline-block;">
                          🔗 Ссылка на товар
                        </a>
                      </div>
                    ` : ''}
                    ${item.notes ? `
                      <div style="color: #6b7280; font-size: 12px; margin-top: 8px; padding: 10px; background: #f9fafb; border-radius: 6px; border-left: 3px solid ${colors.primary};">
                        <strong style="color: #374151;">💬 Примечание:</strong><br/>
                        ${item.notes}
                      </div>
                    ` : ''}
                  </td>
                  <td style="vertical-align: top; width: 140px; padding-left: 12px;">
                    <div style="text-align: right; background: ${colors.light1}; padding: 12px 16px; border-radius: 8px;">
                      <div style="font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px;">Стоимость</div>
                      <div style="font-size: ${fontSize}px; font-weight: 700; color: ${colors.primary}; line-height: 1;">
                        ${item.totalPrice.toLocaleString('ru-RU')} ₽
                      </div>
                      <div style="font-size: 11px; color: #6b7280; margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                        ${item.pricePerUnit.toLocaleString('ru-RU')} ₽ × ${item.quantity} ${item.unit}
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </div>
          `
        })
        
        html += '</div>'
      }

      // Рендерим дочерние блоки с передачей номера родителя
      children.forEach((child: any) => {
        html += renderBlockHTML(child, level + 1, blockNumber, fontSize)
      })

      html += '</div>'
      return html
    }

    const rootBlocks = estimate.designer_estimate_blocks.filter(b => !b.parentId)
    const totalAmount = rootBlocks.reduce((sum: number, block: any) => sum + calculateBlockTotal(block), 0)

    // Собираем все суммы для определения размера шрифта
    const allAmounts: number[] = []
    estimate.designer_estimate_blocks.forEach((block: any) => {
      const blockTotal = calculateBlockTotal(block)
      if (blockTotal > 0) allAmounts.push(blockTotal)
      block.designer_estimate_items?.forEach((item: any) => {
        if (item.totalPrice > 0) allAmounts.push(item.totalPrice)
      })
    })
    allAmounts.push(totalAmount)

    // Находим максимальную сумму
    const maxAmount = Math.max(...allAmounts)

    // Определяем размер шрифта в зависимости от величины суммы
    let amountFontSize = 20
    let totalFontSize = 32
    if (maxAmount >= 10000000) { // >= 10 млн
      amountFontSize = 14
      totalFontSize = 22
    } else if (maxAmount >= 1000000) { // >= 1 млн
      amountFontSize = 16
      totalFontSize = 24
    } else if (maxAmount >= 100000) { // >= 100 тыс
      amountFontSize = 18
      totalFontSize = 28
    }

    let blocksHTML = ''
    rootBlocks.forEach(block => {
      blocksHTML += renderBlockHTML(block, 1, '', amountFontSize)
    })

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${estimate.name}</title>
        <style>
          @page { 
            size: A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'}; 
            margin: 15mm;
          }
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.4;
            color: #1f2937;
            background: #ffffff;
            margin: 0;
            padding: 15px;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
            padding: 20px;
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.dark} 100%);
            color: white;
            border-radius: 10px;
          }
          .header h1 {
            color: white;
            font-size: 28px;
            margin: 0 0 10px 0;
            font-weight: 700;
            letter-spacing: -0.5px;
          }
          .header-description {
            font-size: 14px;
            opacity: 0.95;
            margin: 8px 0 0 0;
          }
          .meta {
            margin: 20px 0;
            padding: 15px;
            background: ${colors.light1};
            border-radius: 8px;
            border: 1px solid ${colors.light2};
          }
          .meta-label {
            font-size: 12px;
            color: #6b7280;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
            font-weight: 600;
          }
          .meta-value {
            font-size: 16px;
            color: #111827;
            font-weight: 600;
          }
          .footer-total {
            margin-top: 25px;
            padding: 20px;
            background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.dark} 100%);
            color: white;
            text-align: center;
            border-radius: 10px;
          }
          .footer-total-label {
            font-size: 14px;
            opacity: 0.95;
            margin-bottom: 10px;
            text-transform: uppercase;
            letter-spacing: 1.2px;
            font-weight: 600;
          }
          .footer-total-amount {
            font-size: 32px;
            font-weight: 700;
            letter-spacing: -1px;
          }
          table {
            border-collapse: collapse;
            width: 100%;
          }
          td {
            vertical-align: top;
          }
          @media print {
            @page {
              orphans: 2;
              widows: 2;
            }
            body { 
              margin: 0; 
              padding: 10mm;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print { 
              display: none !important; 
            }
            * {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header {
              padding: 15px !important;
              margin-bottom: 15px !important;
            }
            .header h1 {
              font-size: 24px !important;
              margin: 0 0 8px 0 !important;
            }
            .header-description {
              font-size: 13px !important;
              margin: 5px 0 0 0 !important;
            }
            .meta {
              padding: 10px !important;
              margin: 10px 0 !important;
            }
            .footer-total {
              padding: 15px !important;
              margin-top: 15px !important;
            }
            .footer-total-amount {
              /* Размер шрифта устанавливается inline */
            }
            h1, h2, h3, h4 {
              page-break-after: avoid;
            }
            table {
              border-collapse: collapse !important;
              width: 100% !important;
            }
            td {
              vertical-align: top !important;
            }
            img {
              display: block !important;
            }
            .block-wrapper {
              margin-bottom: 10px !important;
            }
            .block-header-box {
              padding: 10px !important;
              margin-bottom: 8px !important;
              page-break-inside: avoid !important;
              page-break-after: avoid !important;
            }
            .block-header-box + div {
              page-break-before: avoid !important;
            }
            .items-container > div:first-child {
              page-break-before: avoid !important;
            }
            .item-card-wrapper {
              page-break-inside: avoid !important;
            }
            @media print and (orientation: landscape) {
              .item-card-wrapper {
                page-break-inside: avoid !important;
              }
              .block-header-box {
                page-break-inside: avoid !important;
                page-break-after: avoid !important;
              }
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${estimate.name}</h1>
          ${estimate.description ? `<p class="header-description">${estimate.description}</p>` : ''}
        </div>
        
        <div class="meta">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="width: 33.33%; text-align: center; padding: 10px;">
                <div class="meta-label">👤 Клиент</div>
                <div class="meta-value">${estimate.designer_clients.name}</div>
              </td>
              <td style="width: 33.33%; text-align: center; padding: 10px;">
                <div class="meta-label">✏️ Дизайнер</div>
                <div class="meta-value">${estimate.users.name}</div>
              </td>
              <td style="width: 33.33%; text-align: center; padding: 10px;">
                <div class="meta-label">📅 Дата</div>
                <div class="meta-value">${new Date(estimate.createdAt).toLocaleDateString('ru-RU')}</div>
              </td>
            </tr>
          </table>
        </div>
        
        ${blocksHTML}
        
        <div class="footer-total">
          <div class="footer-total-label">Общая стоимость сметы</div>
          <div class="footer-total-amount" style="font-size: ${totalFontSize}px;">${totalAmount.toLocaleString('ru-RU')} ₽</div>
        </div>
      </body>
      </html>
    `

    // Временно отключено до установки зависимостей
    // if (format === 'pdf') {
    //   try {
    //     const browser = await puppeteer.launch({
    //       headless: true,
    //       args: ['--no-sandbox', '--disable-setuid-sandbox']
    //     })
    //     const page = await browser.newPage()
    //     await page.setContent(html, { waitUntil: 'networkidle0' })
    //     
    //     const pdfBuffer = await page.pdf({
    //       format: 'A4',
    //       landscape: orientation === 'landscape',
    //       printBackground: true,
    //       margin: {
    //         top: '15mm',
    //         right: '15mm',
    //         bottom: '15mm',
    //         left: '15mm'
    //       }
    //     })
    //     
    //     await browser.close()

    //     return new NextResponse(pdfBuffer, {
    //       headers: {
    //         'Content-Type': 'application/pdf',
    //         'Content-Disposition': `attachment; filename="${encodeURIComponent(estimate.name)}.pdf"`
    //       }
    //     })
    //   } catch (puppeteerError) {
    //     console.error('Puppeteer error, falling back to HTML:', puppeteerError)
    //     // Если puppeteer не сработал, возвращаем HTML
    //   }
    // }

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    })
  } catch (error) {
    console.error('Error exporting estimate:', error)
    return NextResponse.json({ error: 'Ошибка экспорта сметы' }, { status: 500 })
  }
}
