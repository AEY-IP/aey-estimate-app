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
    const styleParam = url.searchParams.get('style')
    const shouldAutoPrint = url.searchParams.get('autoPrint') === '1'
    const exportStyle: 'accent' | 'minimal' = styleParam === 'minimal' ? 'minimal' : 'accent'
    const isMinimalStyle = exportStyle === 'minimal'

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

    const escapeHtml = (value: unknown): string => {
      const text = String(value ?? '')
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
    }

    const sanitizeUrl = (value: unknown): string | null => {
      const raw = String(value ?? '').trim()
      if (!raw) return null
      try {
        const url = new URL(raw)
        if (url.protocol === 'http:' || url.protocol === 'https:') {
          return url.toString()
        }
      } catch {
        return null
      }
      return null
    }

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
      return block.designer_estimate_items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0
    }

    // Плоская нумерация блоков: 1, 2, 3... без вложенных 1.1/1.2
    let flatBlockCounter = 0

    function getBlockNumber(): string {
      flatBlockCounter += 1
      return `${flatBlockCounter}`
    }

    function renderBlockMinimalHTML(block: any, level: number = 1, fontSize: number = 20): string {
      const ownItemsTotal = block.designer_estimate_items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0

      const blockNumber = getBlockNumber()
      const blockName = escapeHtml(block.name)
      const blockDescription = escapeHtml(block.description)
      const indentPx = (level - 1) * 10

      let html = `
        <section style="margin: 0 0 12px ${indentPx}px;">
          <div style="display: flex; align-items: baseline; justify-content: space-between; gap: 10px; margin-bottom: 6px;">
            <h${Math.min(level + 1, 4)} style="margin: 0; font-size: ${18 - Math.min(level, 3)}px; font-weight: 700; color: #111827;">
              ${blockNumber}. ${blockName}
            </h${Math.min(level + 1, 4)}>
          </div>
          ${block.description ? `<p style="margin: 0 0 6px 0; font-size: 12px; color: #4b5563;">${blockDescription}</p>` : ''}
      `

      if (block.designer_estimate_items && block.designer_estimate_items.length > 0) {
        const minimalBorderColor = colors.primary
        const minimalHeaderBackground = colors.light1
        const minimalBorder = `2px solid ${minimalBorderColor}`
        const minimalInnerBorder = `1.5px solid ${minimalBorderColor}`
        const minimalColWidthNo = '7%'
        const minimalColWidthPhoto = '10%'
        const minimalColWidthName = '43%'
        const minimalColWidthUnit = '10%'
        const minimalColWidthQty = '10%'
        const minimalColWidthPrice = '10%'
        const minimalColWidthTotal = '10%'

        html += `
          <table style="width: 100%; border-collapse: collapse; table-layout: fixed; margin-bottom: 8px;">
            <colgroup>
              <col style="width: ${minimalColWidthNo};" />
              <col style="width: ${minimalColWidthPhoto};" />
              <col style="width: ${minimalColWidthName};" />
              <col style="width: ${minimalColWidthUnit};" />
              <col style="width: ${minimalColWidthQty};" />
              <col style="width: ${minimalColWidthPrice};" />
              <col style="width: ${minimalColWidthTotal};" />
            </colgroup>
            <thead>
              <tr style="background: ${minimalHeaderBackground};">
                <th style="border: ${minimalBorder}; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #374151;">№</th>
                <th style="border: ${minimalBorder}; padding: 6px 8px; text-align: center; font-size: 10px; text-transform: uppercase; color: #374151;">Фото</th>
                <th style="border: ${minimalBorder}; padding: 6px 8px; text-align: left; font-size: 10px; text-transform: uppercase; color: #374151;">Наименование</th>
                <th style="border: ${minimalBorder}; padding: 6px 8px; text-align: right; font-size: 10px; text-transform: uppercase; color: #374151;">Ед.</th>
                <th style="border: ${minimalBorder}; padding: 6px 8px; text-align: right; font-size: 10px; text-transform: uppercase; color: #374151;">Кол-во</th>
                <th style="border: ${minimalBorder}; padding: 6px 8px; text-align: right; font-size: 10px; text-transform: uppercase; color: #374151;">Цена</th>
                <th style="border: ${minimalBorder}; padding: 6px 8px; text-align: right; font-size: 10px; text-transform: uppercase; color: #374151;">Сумма</th>
              </tr>
            </thead>
            <tbody>
        `

        block.designer_estimate_items.forEach((item: any, idx: number) => {
          const itemNumber = `${blockNumber}.${idx + 1}`
          const safeName = escapeHtml(item.name)
          const safeManufacturer = escapeHtml(item.manufacturer)
          const safeNotes = escapeHtml(item.notes).replace(/\n/g, '<br/>')
          const itemLink = sanitizeUrl(item.link)
          const safeImageUrl = sanitizeUrl(item.imageUrl)

          html += `
            <tr>
              <td style="border: ${minimalInnerBorder}; padding: 6px 8px; font-size: 11px; color: #111827;">${itemNumber}</td>
              <td style="border: ${minimalInnerBorder}; padding: 6px; text-align: center; vertical-align: top; overflow: hidden;">
                ${safeImageUrl
                  ? `<img src="${safeImageUrl}" alt="${safeName}" style="display: block; width: 100%; max-width: 64px; height: auto; max-height: 64px; object-fit: contain; border: ${minimalInnerBorder}; border-radius: 6px; margin: 0 auto; box-sizing: border-box;" />`
                  : ``
                }
              </td>
              <td style="border: ${minimalInnerBorder}; padding: 6px 8px; font-size: 12px; color: #111827; line-height: 1.45; word-break: break-word;">
                <div style="min-width: 0;">
                  <div>${safeName}</div>
                  ${item.manufacturer ? `<div style="margin-top: 2px; font-size: 10px; color: #6b7280;">Производитель: ${safeManufacturer}</div>` : ''}
                  ${itemLink ? `<div style="margin-top: 2px; font-size: 10px;"><a href="${itemLink}" target="_blank" rel="noopener noreferrer" style="color: ${minimalBorderColor}; text-decoration: underline;">Ссылка</a></div>` : ''}
                  ${item.notes ? `<div style="margin-top: 2px; font-size: 10px; color: #6b7280;">${safeNotes}</div>` : ''}
                </div>
              </td>
              <td style="border: ${minimalInnerBorder}; padding: 6px 8px; text-align: right; font-size: 11px; color: #111827;">${escapeHtml(item.unit)}</td>
              <td style="border: ${minimalInnerBorder}; padding: 6px 8px; text-align: right; font-size: 11px; color: #111827;">${item.quantity}</td>
              <td style="border: ${minimalInnerBorder}; padding: 6px 8px; text-align: right; font-size: 11px; color: #111827;">${item.pricePerUnit.toLocaleString('ru-RU')} ₽</td>
              <td style="border: ${minimalInnerBorder}; padding: 6px 8px; text-align: right; font-size: ${Math.max(fontSize - 8, 12)}px; font-weight: 700; color: ${minimalBorderColor};">${item.totalPrice.toLocaleString('ru-RU')} ₽</td>
            </tr>
          `
        })

        html += `
            </tbody>
            <tfoot>
              <tr>
                <td colspan="6" style="border: ${minimalBorder}; padding: 6px 8px; text-align: right; font-size: 10px; text-transform: uppercase; color: #374151; background: ${minimalHeaderBackground};">Итого по разделу "${blockName}"</td>
                <td style="border: ${minimalBorder}; padding: 6px 8px; text-align: right; font-size: ${Math.max(fontSize - 6, 12)}px; font-weight: 700; color: ${minimalBorderColor}; background: ${minimalHeaderBackground};">${ownItemsTotal.toLocaleString('ru-RU')} ₽</td>
              </tr>
            </tfoot>
          </table>
        `
      }

      html += '</section>'
      return html
    }

    function renderBlockAccentHTML(block: any, level: number = 1, fontSize: number = 20): string {
      const ownItemsTotal = block.designer_estimate_items?.reduce((sum: number, item: any) => sum + item.totalPrice, 0) || 0

      const blockNumber = getBlockNumber()
      const blockName = escapeHtml(block.name)
      const blockDescription = escapeHtml(block.description)
      const indentPx = (level - 1) * 14

      let html = `
        <section class="block-wrapper" style="margin: 0 0 16px ${indentPx}px; border: 1px solid ${colors.light2}; border-radius: 10px; overflow: hidden;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 8px; page-break-inside: avoid; background: ${colors.light1}; border-bottom: 1px solid ${colors.light2}; padding: 10px 12px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="background: ${colors.primary}; color: white; border-radius: 999px; font-size: 11px; font-weight: 700; line-height: 1; padding: 5px 9px; min-width: 42px; text-align: center;">${blockNumber}</span>
              <h${Math.min(level + 1, 4)} style="margin: 0; font-size: ${19 - level}px; font-weight: 700; color: #111827; line-height: 1.25;">
                ${blockName}
              </h${Math.min(level + 1, 4)}>
            </div>
          </div>
          <div style="padding: 0 12px 10px 12px;">
            ${block.description ? `<p style="margin: 0 0 8px 0; color: #4b5563; font-size: 12px; line-height: 1.5;">${blockDescription}</p>` : ''}
      `

      if (block.designer_estimate_items && block.designer_estimate_items.length > 0) {
        html += `
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden;">
            <thead>
              <tr style="background: ${colors.light1};">
                <th style="padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: left; width: 58px;">№</th>
                <th style="padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: left;">Позиция</th>
                <th style="padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: right; width: 105px;">Кол-во</th>
                <th style="padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: right; width: 130px;">Цена</th>
                <th style="padding: 8px 10px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; text-align: right; width: 145px;">Сумма</th>
              </tr>
            </thead>
            <tbody>
        `

        block.designer_estimate_items.forEach((item: any, idx: number) => {
          const itemNumber = `${blockNumber}.${idx + 1}`
          const safeName = escapeHtml(item.name)
          const safeManufacturer = escapeHtml(item.manufacturer)
          const safeNotes = escapeHtml(item.notes).replace(/\n/g, '<br/>')
          const itemLink = sanitizeUrl(item.link)
          const safeImageUrl = sanitizeUrl(item.imageUrl)

          html += `
            <tr style="border-top: 1px solid #e5e7eb;">
              <td style="padding: 10px; vertical-align: top;">
                <span style="background: ${colors.primary}; color: white; border-radius: 999px; font-size: 10px; font-weight: 700; line-height: 1; padding: 4px 7px; display: inline-block;">
                  ${itemNumber}
                </span>
              </td>
              <td style="padding: 10px; vertical-align: top;">
                <div style="display: flex; gap: 10px; align-items: flex-start;">
                  ${safeImageUrl ? `<img src="${safeImageUrl}" alt="${safeName}" style="width: 58px; height: 58px; object-fit: cover; border-radius: 8px; border: 1px solid #d1d5db;" />` : ''}
                  <div style="min-width: 0;">
                    <div style="font-size: 13px; font-weight: 600; color: #111827; line-height: 1.4;">${safeName}</div>
                    ${item.manufacturer ? `<div style="font-size: 11px; color: #4b5563; margin-top: 3px;">Производитель: ${safeManufacturer}</div>` : ''}
                    ${itemLink ? `<div style="font-size: 11px; margin-top: 4px;"><a href="${itemLink}" target="_blank" rel="noopener noreferrer" style="color: ${colors.primary}; text-decoration: none;">Ссылка на товар</a></div>` : ''}
                    ${item.notes ? `<div style="font-size: 10px; color: #6b7280; margin-top: 5px; line-height: 1.45;">${safeNotes}</div>` : ''}
                  </div>
                </div>
              </td>
              <td style="padding: 10px; vertical-align: top; text-align: right; font-size: 12px; color: #374151;">
                ${item.quantity} ${escapeHtml(item.unit)}
              </td>
              <td style="padding: 10px; vertical-align: top; text-align: right; font-size: 12px; color: #374151;">
                ${item.pricePerUnit.toLocaleString('ru-RU')} ₽
              </td>
              <td style="padding: 10px; vertical-align: top; text-align: right; font-size: ${Math.max(fontSize - 4, 13)}px; color: ${colors.primary}; font-weight: 700;">
                ${item.totalPrice.toLocaleString('ru-RU')} ₽
              </td>
            </tr>
          `
        })

        html += `
            </tbody>
            <tfoot>
              <tr style="background: #fafafa; border-top: 1px solid #e5e7eb;">
                <td colspan="4" style="padding: 10px; text-align: right; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.4px;">
                  Итого по разделу "${blockName}"
                </td>
                <td style="padding: 10px; text-align: right; font-size: ${Math.max(fontSize - 2, 14)}px; color: ${colors.primary}; font-weight: 700;">
                  ${ownItemsTotal.toLocaleString('ru-RU')} ₽
                </td>
              </tr>
            </tfoot>
          </table>
        `
      }

      html += '</div></section>'
      return html
    }

    const estimateName = escapeHtml(estimate.name)
    const estimateDescription = escapeHtml(estimate.description).replace(/\n/g, '<br/>')
    const flatBlocks = [...estimate.designer_estimate_blocks].sort((a, b) => a.sortOrder - b.sortOrder)
    const totalAmount = flatBlocks.reduce((sum: number, block: any) => sum + calculateBlockTotal(block), 0)

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
    flatBlocks.forEach(block => {
      blocksHTML += isMinimalStyle
        ? renderBlockMinimalHTML(block, 1, amountFontSize)
        : renderBlockAccentHTML(block, 1, amountFontSize)
    })

    const autoPrintScript = shouldAutoPrint
      ? `
        <script>
          window.addEventListener('load', () => {
            setTimeout(() => {
              window.focus()
              window.print()
            }, 120)
          })
        </script>
      `
      : ''

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${estimateName}</title>
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
            background: ${isMinimalStyle ? '#ffffff' : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.dark} 100%)`};
            color: ${isMinimalStyle ? '#111827' : 'white'};
            border: ${isMinimalStyle ? '1px solid #d1d5db' : 'none'};
            border-radius: 10px;
          }
          .header h1 {
            color: inherit;
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
          .footer-total {
            margin-top: 25px;
            padding: 20px;
            background: ${isMinimalStyle ? '#ffffff' : `linear-gradient(135deg, ${colors.primary} 0%, ${colors.dark} 100%)`};
            color: ${isMinimalStyle ? '#111827' : 'white'};
            text-align: center;
            border-radius: 10px;
            border: ${isMinimalStyle ? '1px solid #d1d5db' : 'none'};
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
          <h1>${estimateName}</h1>
          ${estimate.description ? `<p class="header-description">${estimateDescription}</p>` : ''}
        </div>
        
        ${blocksHTML}
        
        <div class="footer-total">
          <div class="footer-total-label">Общая стоимость сметы</div>
          <div class="footer-total-amount" style="font-size: ${totalFontSize}px;">${totalAmount.toLocaleString('ru-RU')} ₽</div>
        </div>
        ${autoPrintScript}
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
