import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { cookies } from 'next/headers'

// Проверка авторизации
async function checkAuthLocal() {
  const cookieStore = cookies()
  const sessionCookie = cookieStore.get('auth-session')
  
  if (!sessionCookie) {
    return null
  }
  
  try {
    const decodedValue = Buffer.from(sessionCookie.value, 'base64').toString('utf-8')
    const sessionData = JSON.parse(decodedValue)
    return sessionData
  } catch (error) {
    return null
  }
}

// Формирует полную структуру помещения как ожидает фронтенд
function formatRoomForFrontend(room: any) {
  let worksBlock
  
  // Если есть сохраненная структура блоков, используем её
  if (room.worksBlockStructure) {
    try {
      worksBlock = JSON.parse(room.worksBlockStructure)
      
      // Обновляем данные работ из базы данных
      worksBlock.blocks.forEach((block: any) => {
        block.items.forEach((item: any) => {
          const workFromDB = room.works.find((w: any) => w.id === item.id)
          if (workFromDB) {
            item.quantity = workFromDB.quantity
            item.unitPrice = workFromDB.price
            item.totalPrice = workFromDB.totalPrice
            item.description = workFromDB.description
          }
        })
        
        // Пересчитываем totalPrice блока
        block.totalPrice = block.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
      })
      
      // Пересчитываем общий totalPrice
      worksBlock.totalPrice = worksBlock.blocks.reduce((sum: number, block: any) => sum + block.totalPrice, 0)
      
    } catch (error) {
      console.error('Error parsing worksBlockStructure:', error)
      worksBlock = null
    }
  }
  
  // Если нет сохраненной структуры, создаем заново (для обратной совместимости)
  if (!worksBlock) {
    // Группируем работы по блокам
    const worksByBlock: { [key: string]: any } = {}
    room.works.forEach((work: any) => {
      // Используем сохраненное пользователем название блока, если есть, иначе исходную категорию
      const blockTitle = work.blockTitle || work.workItem.block?.title || work.workItem.blockTitle || 'Без категории'
      if (!worksByBlock[blockTitle]) {
        worksByBlock[blockTitle] = {
          id: `block_${blockTitle.replace(/\s+/g, '_')}`,
          title: blockTitle,
          items: [],
          totalPrice: 0,
          order: Object.keys(worksByBlock).length + 1 // Присваиваем порядковый номер
        }
      }
      worksByBlock[blockTitle].items.push({
        id: work.id,
        workId: work.workItemId,
        name: work.workItem.name,
        unit: work.workItem.unit,
        quantity: work.quantity,
        unitPrice: work.price,
        totalPrice: work.totalPrice,
        description: work.description
      })
    })

    // Считаем totalPrice для каждого блока
    Object.values(worksByBlock).forEach((block: any) => {
      block.totalPrice = block.items.reduce((sum: number, item: any) => sum + item.totalPrice, 0)
    })
    
    worksBlock = {
      id: `works_${room.id}`,
      title: `Работы - ${room.name}`,
      blocks: Object.values(worksByBlock),
      totalPrice: room.totalWorksPrice
    }
  }

  // Форматируем параметры помещения
  const roomParameters = room.roomParameterValues ? {
    id: `room_params_${room.id}`,
    title: 'Параметры помещения',
    parameters: room.roomParameterValues.map((paramValue: any) => ({
      parameterId: paramValue.parameterId,
      name: paramValue.parameter.name,
      unit: paramValue.parameter.unit,
      value: paramValue.value
    }))
  } : undefined

  return {
    id: room.id,
    name: room.name,
    totalWorksPrice: room.totalWorksPrice,
    totalMaterialsPrice: room.totalMaterialsPrice,
    totalPrice: room.totalPrice,
    roomParameters,
    worksBlock,
    materialsBlock: {
      id: `materials_${room.id}`,
      title: `Материалы - ${room.name}`,
      items: room.materials.map((material: any) => ({
        id: material.id,
        name: material.name,
        unit: material.unit,
        quantity: material.quantity,
        unitPrice: material.price,
        totalPrice: material.totalPrice,
        description: material.description
      })),
      totalPrice: room.totalMaterialsPrice
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = await checkAuthLocal()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        rooms: {
          include: {
            works: {
              include: {
                workItem: true
              }
            },
            materials: true,
            // @ts-ignore
            roomParameterValues: {
              include: {
                parameter: true
              }
            }
          }
        },
        // @ts-ignore
        roomParameterValues: {
          include: {
            parameter: true
          }
        },
        coefficients: true
      }
    })

    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    // Форматируем данные для фронтенда
    const formattedEstimate: any = {
      ...estimate,
      // @ts-ignore
      rooms: estimate.rooms ? estimate.rooms.map(formatRoomForFrontend) : [],
      // Парсим JSON поля коэффициентов
      // @ts-ignore
      coefficients: estimate?.coefficientsData ? JSON.parse(estimate.coefficientsData) : [],
      // @ts-ignore
      coefficientSettings: estimate?.coefficientSettings ? JSON.parse(estimate.coefficientSettings) : {},
      // @ts-ignore
      manualPrices: estimate?.manualPrices ? JSON.parse(estimate.manualPrices) : [],
      // Парсим JSON поля блоков для apartment
      // @ts-ignore
      worksBlock: estimate?.worksBlock ? JSON.parse(estimate.worksBlock) : null,
      // @ts-ignore
      materialsBlock: estimate?.materialsBlock ? JSON.parse(estimate.materialsBlock) : null,
      // @ts-ignore
      summaryWorksBlock: estimate?.summaryWorksBlock ? JSON.parse(estimate.summaryWorksBlock) : null,
      // @ts-ignore
      summaryMaterialsBlock: estimate?.summaryMaterialsBlock ? JSON.parse(estimate.summaryMaterialsBlock) : null
    }

    // Для смет типа "apartment" добавляем базовые блоки если их нет
    if (estimate.type === 'apartment') {
      if (!formattedEstimate.worksBlock) {
        formattedEstimate.worksBlock = {
          id: `works_${estimate.id}`,
          title: "Работы",
          blocks: [],
          totalPrice: 0
        }
      }
      if (!formattedEstimate.materialsBlock) {
        formattedEstimate.materialsBlock = {
          id: `materials_${estimate.id}`,
          title: "Материалы", 
          items: [],
          totalPrice: 0
        }
      }
    }

    // Для смет типа "rooms" добавляем сводные блоки если их нет
    if (estimate.type === 'rooms') {
      if (!formattedEstimate.summaryWorksBlock) {
        formattedEstimate.summaryWorksBlock = {
          id: `summary_works_${estimate.id}`,
          title: "Сводная смета - Работы",
          blocks: [],
          totalPrice: 0
        }
      }
      if (!formattedEstimate.summaryMaterialsBlock) {
        formattedEstimate.summaryMaterialsBlock = {
          id: `summary_materials_${estimate.id}`,
          title: "Сводная смета - Материалы", 
          items: [],
          totalPrice: 0
        }
      }
    }

    return NextResponse.json(formattedEstimate)
  } catch (error) {
    console.error('Error fetching estimate:', error)
    return NextResponse.json(
      { error: 'Ошибка при получении сметы' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = await checkAuthLocal()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    console.log('=== ESTIMATE API PUT START ===')
    console.log('Estimate ID:', params.id)
    console.log('User:', session.username)
    
    const body = await request.json()
    console.log('Request body keys:', Object.keys(body))
    console.log('Body type:', body.type)
    console.log('Body rooms:', body.rooms ? `${body.rooms.length} rooms` : 'no rooms')
    if (body.rooms && body.rooms.length > 0) {
      console.log('First room structure:', JSON.stringify(body.rooms[0], null, 2))
    }
    
    // Проверяем что смета существует
    const existingEstimate = await prisma.estimate.findUnique({
      where: { id: params.id }
    })
    
    if (!existingEstimate) {
      console.log('Estimate not found')
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    // Создаем объект только с разрешенными полями
    const updateData: any = {
      updatedAt: new Date()
    }
    
    // Вручную добавляем только те поля, которые точно есть в схеме
    if (body.title !== undefined) updateData.title = body.title
    if (body.type !== undefined) updateData.type = body.type
    if (body.category !== undefined) updateData.category = body.category
    if (body.totalWorksPrice !== undefined) updateData.totalWorksPrice = body.totalWorksPrice
    if (body.totalMaterialsPrice !== undefined) updateData.totalMaterialsPrice = body.totalMaterialsPrice
    if (body.totalPrice !== undefined) updateData.totalPrice = body.totalPrice

    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.coefficients !== undefined) updateData.coefficientsData = JSON.stringify(body.coefficients)
    if (body.coefficientSettings !== undefined) updateData.coefficientSettings = JSON.stringify(body.coefficientSettings)
    if (body.manualPrices !== undefined) updateData.manualPrices = JSON.stringify(body.manualPrices)
    
    // Для смет типа "apartment" добавляем worksBlock и materialsBlock
    if (body.type === 'apartment') {
      console.log('Processing apartment estimate data')
      
      if (body.worksBlock) {
        console.log('Updating worksBlock for apartment')
        updateData.worksBlock = JSON.stringify(body.worksBlock)
      }
      
      if (body.materialsBlock) {
        console.log('Updating materialsBlock for apartment')
        updateData.materialsBlock = JSON.stringify(body.materialsBlock)
      }
    }
    
    console.log('Filtered update data:', updateData)
    console.log('Filtered keys:', Object.keys(updateData))
    
    // Обновляем базовые поля сметы  
    const updatedEstimate = await prisma.estimate.update({
      where: { id: params.id },
      data: updateData
    })

    // Теперь обновляем помещения, если они переданы
    if (body.rooms && Array.isArray(body.rooms)) {
      console.log('Updating rooms, count:', body.rooms.length)
      
      // Получаем существующие помещения
      const existingRooms = await prisma.estimateRoom.findMany({
        where: { estimateId: params.id }
      })
      
      // Обрабатываем каждое помещение
      for (const room of body.rooms) {
        console.log('Processing room:', room.name)
        
        let roomData: any = {
          name: room.name,
          totalWorksPrice: room.totalWorksPrice || 0,
          totalMaterialsPrice: room.totalMaterialsPrice || 0,
          totalPrice: room.totalPrice || 0,
          worksBlockStructure: room.worksBlock ? JSON.stringify(room.worksBlock) : null
        }

        let savedRoom
        
        // Если у помещения есть ID, обновляем существующее
        if (room.id && existingRooms.find((r: any) => r.id === room.id)) {
          console.log('Updating existing room:', room.id)
          savedRoom = await prisma.estimateRoom.update({
            where: { id: room.id },
            data: roomData
          })
        } else {
          // Создаем новое помещение
          console.log('Creating new room')
          savedRoom = await prisma.estimateRoom.create({
            data: {
              ...roomData,
              estimateId: params.id
            }
          })
        }

        // Обновляем работы помещения
        if (room.worksBlock?.blocks) {
          console.log('Updating works for room:', savedRoom.id)
          
          // Удаляем старые работы
          await prisma.estimateWork.deleteMany({
            where: { roomId: savedRoom.id }
          })
          
          // Создаем новые работы
          const works = room.worksBlock.blocks.flatMap((block: any) =>
            (block.items || []).map((item: any) => ({
              roomId: savedRoom.id,
              quantity: item.quantity || 0,
              price: item.unitPrice || 0,
              totalPrice: item.totalPrice || 0,
              description: item.description || '',
              workItemId: item.workId || item.workItemId,
              blockTitle: block.title // Сохраняем пользовательское название блока/категории
            }))
          ).filter((work: any) => work.workItemId) // Только работы с привязкой к справочнику
          
          
          if (works.length > 0) {
            await prisma.estimateWork.createMany({
              data: works
            })
          }
        }

        // Обновляем материалы помещения
        if (room.materialsBlock?.items) {
          console.log('Updating materials for room:', savedRoom.id)
          
          // Удаляем старые материалы
          await prisma.estimateMaterial.deleteMany({
            where: { roomId: savedRoom.id }
          })
          
          // Создаем новые материалы
          const materials = room.materialsBlock.items.map((item: any) => ({
            roomId: savedRoom.id,
            name: item.name,
            unit: item.unit,
            quantity: item.quantity || 0,
            price: item.unitPrice || 0,
            totalPrice: item.totalPrice || 0,
            description: item.description || ''
          }))
          
          if (materials.length > 0) {
            await prisma.estimateMaterial.createMany({
              data: materials
            })
          }
        }

        // Обновляем параметры помещения
        if (room.roomParameters?.parameters) {
          console.log('Updating room parameters for room:', savedRoom.id)
          
          // Удаляем старые параметры помещения
          // @ts-ignore
          await prisma.estimateRoomParameterValue.deleteMany({
            where: { roomId: savedRoom.id }
          })
          
          // Создаем новые параметры помещения
          const roomParams = room.roomParameters.parameters.map((param: any) => ({
            roomId: savedRoom.id,
            parameterId: param.parameterId,
            value: param.value || 0
          }))
          
          if (roomParams.length > 0) {
            // @ts-ignore
            await prisma.estimateRoomParameterValue.createMany({
              data: roomParams
            })
          }
        }
      }
    }

    // Обновляем глобальные параметры помещения (для сводной сметы)
    if (body.roomParameters?.parameters) {
      console.log('Updating global room parameters')
      
      // Удаляем старые глобальные параметры
      // @ts-ignore
      await prisma.estimateRoomParameterValue.deleteMany({
        where: { 
          estimateId: params.id,
          roomId: null 
        }
      })
      
      // Создаем новые глобальные параметры
      const globalParams = body.roomParameters.parameters.map((param: any) => ({
        estimateId: params.id,
        parameterId: param.parameterId,
        value: param.value || 0
      }))
      
      if (globalParams.length > 0) {
        // @ts-ignore
        await prisma.estimateRoomParameterValue.createMany({
          data: globalParams
        })
      }
    }

    // Получаем обновленную смету с всеми связанными данными
    const finalEstimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        creator: {
          select: {
            id: true,
            username: true
          }
        },
        rooms: {
          include: {
            works: {
              include: {
                workItem: true
              }
            },
            materials: true,
            // @ts-ignore
            roomParameterValues: {
              include: {
                parameter: true
              }
            }
          }
        },
        // @ts-ignore
        roomParameterValues: {
          include: {
            parameter: true
          }
        },
        coefficients: true
      }
    })
    
    console.log('Estimate updated successfully')
    
    // Форматируем данные для фронтенда
    const formattedEstimate: any = {
      ...finalEstimate,
      // @ts-ignore
      rooms: finalEstimate?.rooms ? finalEstimate.rooms.map(formatRoomForFrontend) : [],
      // Парсим JSON поля коэффициентов
      // @ts-ignore
      coefficients: finalEstimate?.coefficientsData ? JSON.parse(finalEstimate.coefficientsData) : [],
      // @ts-ignore
      coefficientSettings: finalEstimate?.coefficientSettings ? JSON.parse(finalEstimate.coefficientSettings) : {},
      // @ts-ignore
      manualPrices: finalEstimate?.manualPrices ? JSON.parse(finalEstimate.manualPrices) : [],
      // Парсим JSON поля для смет типа "apartment"
      // @ts-ignore
      worksBlock: finalEstimate?.worksBlock ? JSON.parse(finalEstimate.worksBlock) : null,
      // @ts-ignore
      materialsBlock: finalEstimate?.materialsBlock ? JSON.parse(finalEstimate.materialsBlock) : null,
      // @ts-ignore
      summaryWorksBlock: finalEstimate?.summaryWorksBlock ? JSON.parse(finalEstimate.summaryWorksBlock) : null,
      // @ts-ignore
      summaryMaterialsBlock: finalEstimate?.summaryMaterialsBlock ? JSON.parse(finalEstimate.summaryMaterialsBlock) : null
    }
    
    // Для смет типа "rooms" добавляем сводные блоки если их нет
    if (finalEstimate?.type === 'rooms') {
      if (!formattedEstimate.summaryWorksBlock) {
        formattedEstimate.summaryWorksBlock = {
          id: `summary_works_${finalEstimate.id}`,
          title: "Сводная смета - Работы",
          blocks: [],
          totalPrice: 0
        }
      }
      if (!formattedEstimate.summaryMaterialsBlock) {
        formattedEstimate.summaryMaterialsBlock = {
          id: `summary_materials_${finalEstimate.id}`,
          title: "Сводная смета - Материалы", 
          items: [],
          totalPrice: 0
        }
      }
    }
    
    console.log('=== ESTIMATE API PUT END ===')
    return NextResponse.json(formattedEstimate)
  } catch (error) {
    console.error('=== ESTIMATE API PUT ERROR ===')
    console.error('Error details:', error)
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error')
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { error: 'Ошибка обновления сметы' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию
    const session = await checkAuthLocal()
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Получаем смету с полными данными перед удалением
    const estimate = await prisma.estimate.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        creator: true,
        rooms: {
          include: {
            works: {
              include: {
                workItem: true
              }
            },
            materials: true,
            roomParameterValues: {
              include: {
                parameter: true
              }
            }
          }
        },
        roomParameterValues: {
          include: {
            parameter: true
          }
        },
        coefficients: true
      }
    })

    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    // Сохраняем удаленную смету в таблицу deleted_estimates
    await prisma.deletedEstimate.create({
      data: {
        originalId: estimate.id,
        title: estimate.title,
        type: estimate.type,
        category: estimate.category,
        totalWorksPrice: estimate.totalWorksPrice,
        totalMaterialsPrice: estimate.totalMaterialsPrice,
        totalPrice: estimate.totalPrice,
        notes: estimate.notes,
        coefficientsData: (estimate as any).coefficientsData,
        coefficientSettings: (estimate as any).coefficientSettings,
        manualPrices: (estimate as any).manualPrices,
        estimateData: JSON.stringify(estimate), // Сохраняем полные данные
        deletedBy: session.id,
        clientId: estimate.clientId,
        originalCreatedBy: estimate.createdBy,
        originalCreatedAt: estimate.createdAt,
        originalUpdatedAt: estimate.updatedAt
      }
    })

    // Удаляем оригинальную смету (каскадное удаление позаботится о связанных данных)
    await prisma.estimate.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Смета успешно удалена' })
  } catch (error) {
    console.error('Ошибка удаления сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка удаления сметы' },
      { status: 500 }
    )
  }
} 