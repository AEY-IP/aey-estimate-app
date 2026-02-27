import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/database'
import { checkAuth, checkClientAuth, canAccessMainSystem } from '@/lib/auth'


export const dynamic = 'force-dynamic'
function formatRoomForFrontend(room: any): any {
  return {
    ...room,
    roomParameterValues: room.roomParameterValues?.map((rpv: any) => ({
      ...rpv,
      parameter: rpv.parameter
    })) || []
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🔍 GET /api/estimates/[id] called with ID:', params.id)
    // Проверяем авторизацию (админ или клиент)
    const session = checkAuth(request)
    
    // Внешние дизайнеры не имеют доступа к основным сметам
    if (session && !canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }
    
    const clientSession = checkClientAuth(request)
    
    let userId: string
    let userType: 'admin' | 'client' = 'admin'
    let targetClientId: string | null = null

    if (session) {
      // Авторизация админа/менеджера
      userId = session.id
      userType = 'admin'
    } else if (clientSession) {
      // Авторизация клиента
      userId = clientSession.clientUserId
      userType = 'client'
      targetClientId = clientSession.clientId
    } else {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }

    // Безопасная загрузка сметы с проверкой типа
    const estimate = await (prisma as any).estimate.findUnique({
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
        roomParameterValues: {
          include: {
            parameter: true
          }
        }
      }
    })

    // Если смета типа "rooms", пытаемся загрузить помещения
    let rooms: any[] = []
    if (estimate && estimate.type === 'rooms') {
      try {
        console.log('🏠 Loading rooms for estimate:', params.id)
        rooms = await (prisma as any).estimateRoom.findMany({
          where: { estimateId: params.id },
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
          },
          orderBy: {
            sortOrder: 'asc'
          }
        })
        console.log('🏠 Rooms loaded from DB:', rooms.length)
        
        // Форматируем помещения для фронтенда
        rooms = rooms.map((room: any) => {
          // Группируем работы по блокам
          const worksByBlock: { [key: string]: any } = {}
          room.works.forEach((work: any) => {
            const blockTitle = work.blockTitle || work.workItem?.blockTitle || 'Без категории'
            if (!worksByBlock[blockTitle]) {
              worksByBlock[blockTitle] = {
                id: `block_${blockTitle.replace(/\s+/g, '_')}`,
                title: blockTitle,
                items: [],
                totalPrice: 0
              }
            }
            
            const workName = work.workItem?.name || work.manualWorkName || 'Без названия'
            const workUnit = work.workItem?.unit || work.manualWorkUnit || 'шт'
            
            worksByBlock[blockTitle].items.push({
              id: work.id,
              workId: work.workItemId,
              name: workName,
              unit: workUnit,
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

          return {
            id: room.id,
            name: room.name,
            totalWorksPrice: room.totalWorksPrice,
            totalMaterialsPrice: room.totalMaterialsPrice,
            totalPrice: room.totalPrice,
            worksBlock: {
              id: `works_${room.id}`,
              title: `Работы - ${room.name}`,
              blocks: Object.values(worksByBlock),
              totalPrice: room.totalWorksPrice
            },
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
            },
            roomParameterValues: room.roomParameterValues?.map((rpv: any) => ({
              ...rpv,
              parameter: rpv.parameter
            })) || [],
            roomParameters: {
              id: `room_params_${room.id}`,
              title: `Параметры помещения - ${room.name}`,
              parameters: room.roomParameterValues?.map((rpv: any) => ({
                parameterId: rpv.parameterId,
                value: rpv.value,
                parameter: rpv.parameter
              })) || []
            }
      }
    })
        console.log('🏠 Rooms formatted:', rooms.length)
      } catch (roomsError) {
        console.error('❌ Error loading rooms data:', roomsError)
        // Если не удалось загрузить помещения, оставляем пустой массив
        rooms = []
      }
    }

    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    // Проверяем доступ
    if (userType === 'client') {
      // Клиент может видеть только свои сметы, которые видимы для клиента
      if (estimate.clientId !== targetClientId || !estimate.showToClient) {
        return NextResponse.json(
          { error: 'Смета не найдена или недоступна' },
          { status: 404 }
        )
      }
    } else if (session && session.role === 'MANAGER') {
      // Менеджер может видеть только сметы своих клиентов
      const client = await prisma.clients.findUnique({
        where: { id: estimate.clientId }
      })
      if (!client || client.createdBy !== session.id) {
        return NextResponse.json(
          { error: 'Доступ запрещен' },
          { status: 403 }
        )
      }
    }

    // Форматируем данные для фронтенда
    const formattedEstimate: any = {
      ...estimate,
      // Возвращаем загруженные помещения
      rooms: rooms,
      // Парсим JSON поля коэффициентов
      coefficients: estimate?.coefficientsData ? JSON.parse(estimate.coefficientsData) : [],
      coefficientSettings: estimate?.coefficientSettings ? JSON.parse(estimate.coefficientSettings) : {},
      manualPrices: estimate?.manualPrices ? JSON.parse(estimate.manualPrices) : [],
      // Парсим JSON поля блоков для apartment
      worksBlock: estimate?.worksBlock ? JSON.parse(estimate.worksBlock) : null,
      materialsBlock: estimate?.materialsBlock ? JSON.parse(estimate.materialsBlock) : null,
      summaryWorksBlock: estimate?.summaryWorksBlock ? JSON.parse(estimate.summaryWorksBlock) : null,
      summaryMaterialsBlock: estimate?.summaryMaterialsBlock ? JSON.parse(estimate.summaryMaterialsBlock) : null,
      // Добавляем глобальные параметры помещений (для сводной сметы)
      roomParameters: (estimate?.roomParameterValues && estimate.roomParameterValues.filter((rpv: any) => rpv.roomId === null).length > 0) ? {
        id: `room_params_summary_${estimate.id}`,
        title: 'Параметры сводной сметы',
        parameters: estimate.roomParameterValues.filter((rpv: any) => rpv.roomId === null).map((rpv: any) => ({
          parameterId: rpv.parameterId,
          value: rpv.value,
          parameter: rpv.parameter
        }))
      } : null
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
    console.log('=== ESTIMATE API PUT START ===')
    console.log('Estimate ID:', params.id)
    
    // Проверяем авторизацию (только админы могут редактировать)
    const session = checkAuth(request)
    if (!session) {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }
    
    // Внешние дизайнеры не имеют доступа к основным сметам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    console.log('✅ User authorized:', session.username)
    
    const body = await request.json()
    console.log('📋 Request body received')
    console.log('Body keys:', Object.keys(body))
    console.log('Body type:', body.type)
    console.log('Body rooms count:', body.rooms ? body.rooms.length : 0)
    
    // Дополнительное логирование для диагностики
    console.log('Body size (chars):', JSON.stringify(body).length)
    console.log('Body has worksBlock:', !!body.worksBlock)
    console.log('Body has materialsBlock:', !!body.materialsBlock)
    console.log('Body has rooms:', !!body.rooms && Array.isArray(body.rooms))
    
    if (body.rooms) {
      console.log('Rooms details:')
      body.rooms.forEach((room: any, index: number) => {
        console.log(`  Room ${index}:`, {
          id: room.id,
          name: room.name,
          hasWorksBlock: !!room.worksBlock,
          hasParams: !!room.roomParameters
        })
      })
    }
    
    // Проверяем что смета существует
    console.log('🔍 Checking if estimate exists...')
    const existingEstimate = await prisma.estimates.findUnique({
      where: { id: params.id }
    })
    
    if (!existingEstimate) {
      console.log('❌ Estimate not found')
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }
    
    console.log('✅ Estimate found:', existingEstimate.title)
    
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
    let updatedEstimate
    try {
      console.log('🔄 Updating basic estimate fields...')
      updatedEstimate = await prisma.estimates.update({
        where: { id: params.id },
        data: updateData
      })
      console.log('✅ Basic estimate fields updated successfully')
    } catch (updateError) {
      console.error('❌ Error updating basic estimate fields:', updateError)
      throw updateError
    }

    // Теперь обновляем помещения, если они переданы
    if (body.rooms && Array.isArray(body.rooms)) {
      try {
        console.log('🏠 Processing rooms, count:', body.rooms.length)
        
        // Получаем существующие помещения
        console.log('🔍 Fetching existing rooms...')
        const existingRooms = await prisma.estimateRoom.findMany({
          where: { estimateId: params.id }
        })
        console.log('📊 Existing rooms found:', existingRooms.length)
        
        // БЕЗОПАСНАЯ ПРОВЕРКА: Если с фронтенда пришло меньше помещений чем есть в базе,
        // то скорее всего это частичное обновление (например, только одного помещения).
        // В таком случае обновляем только те помещения, которые реально пришли.
        const isPartialUpdate = body.rooms.length < existingRooms.length
        if (isPartialUpdate) {
          console.log('⚠️ Partial update detected - will only update provided rooms')
        }
      
        // Обрабатываем ТОЛЬКО те помещения, которые пришли с фронтенда
        for (const room of body.rooms) {
          console.log('🏠 Processing room:', room.name, 'ID:', room.id)
          
          let roomData: any = {
            name: room.name,
            totalWorksPrice: room.totalWorksPrice || 0,
            totalMaterialsPrice: room.totalMaterialsPrice || 0,
            totalPrice: room.totalPrice || 0
          }

          let savedRoom
          
          // Если у помещения есть ID, обновляем существующее
          if (room.id && existingRooms.find((r: any) => r.id === room.id)) {
            console.log('🔄 Updating existing room:', room.id)
            savedRoom = await prisma.estimateRoom.update({
              where: { id: room.id },
              data: roomData
            })
            console.log('✅ Room updated successfully')
          } else {
            // Создаем новое помещение
            console.log('➕ Creating new room')
            savedRoom = await prisma.estimateRoom.create({
              data: {
                ...roomData,
                estimateId: params.id
              }
            })
            console.log('✅ New room created with ID:', savedRoom.id)
          }

          // Обновляем работы помещения ТОЛЬКО если пришли РЕАЛЬНЫЕ данные worksBlock
          // Проверяем что в блоках есть хотя бы одна работа
          const hasRealWorksData = room.worksBlock?.blocks && 
            room.worksBlock.blocks.some((block: any) => block.items && block.items.length > 0)
          
          if (hasRealWorksData) {
            try {
              console.log('Updating works for room:', savedRoom.id)
              
              // Удаляем старые работы ТОЛЬКО из этого помещения
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
                  workItemId: item.workId || item.workItemId || null, // Разрешаем null для ручных работ
                  blockTitle: block.title, // Сохраняем пользовательское название блока/категории
                  // Для ручных работ сохраняем название и единицу измерения
                  manualWorkName: (!item.workId && !item.workItemId) ? item.name : null,
                  manualWorkUnit: (!item.workId && !item.workItemId) ? item.unit : null
                }))
              ) // Убираем фильтр - сохраняем ВСЕ работы, включая ручные
              
              if (works.length > 0) {
                // Разделяем работы на автоматические (с workItemId) и ручные (без workItemId)
                const automaticWorks = works.filter((work: any) => work.workItemId)
                const manualWorks = works.filter((work: any) => !work.workItemId)
                
                console.log('📊 Works breakdown:', {
                  total: works.length,
                  automatic: automaticWorks.length,
                  manual: manualWorks.length
                })
                
                // Создаем все работы (автоматические и ручные)
                await prisma.estimateWork.createMany({
                  data: works
                })
                
                console.log('✅ Created', works.length, 'works for room')
              }
            } catch (worksError) {
              console.error('❌ Error updating works for room:', savedRoom.id)
              console.error('Works error details:', worksError)
              throw worksError
            }
          }

          // Обновляем материалы помещения
          const hasRealMaterialsData = room.materialsBlock?.items && room.materialsBlock.items.length > 0
          
          if (hasRealMaterialsData) {
            try {
              console.log('Updating materials for room:', savedRoom.id)
              
              // Удаляем старые материалы ТОЛЬКО из этого помещения
              await prisma.estimateMaterial.deleteMany({
                where: { roomId: savedRoom.id }
              })
              
              // Создаем новые материалы
              const materials = room.materialsBlock.items.map((item: any) => ({
                roomId: savedRoom.id,
                name: item.name,
                unit: item.unit,
                quantity: item.quantity || 0,
                unitPrice: item.unitPrice || 0,
                totalPrice: item.totalPrice || 0
              }))
              
              if (materials.length > 0) {
                await prisma.estimateMaterial.createMany({
                  data: materials
                })
                console.log('✅ Created', materials.length, 'materials for room')
              }
            } catch (materialsError) {
              console.error('❌ Error updating materials for room:', savedRoom.id)
              console.error('Materials error details:', materialsError)
              throw materialsError
            }  
          }

          // Обновляем параметры помещения если есть
          if (room.roomParameters?.parameters && Array.isArray(room.roomParameters.parameters)) {
            try {
              console.log('Updating room parameters for room:', savedRoom.id)
              
              // Удаляем старые параметры ТОЛЬКО для этого помещения
              // @ts-ignore
              await prisma.estimateRoomParameterValue.deleteMany({
                where: { 
                  estimateId: params.id,
                  roomId: savedRoom.id 
                }
              })
              
              // Создаем новые параметры
              const roomParams = room.roomParameters.parameters
                .filter((param: any) => param.parameterId && param.value !== undefined)
                .map((param: any) => ({
                  estimateId: params.id,
                  roomId: savedRoom.id,
                  parameterId: param.parameterId,
                  value: param.value || 0
                }))
              
              if (roomParams.length > 0) {
                // @ts-ignore
                await prisma.estimateRoomParameterValue.createMany({
                  data: roomParams
                })
                console.log('✅ Created', roomParams.length, 'room parameters')
              }
            } catch (paramsError) {
              console.error('❌ Error updating room parameters for room:', savedRoom.id)
              console.error('Room params error details:', paramsError)
              throw paramsError
            }
          }
        }
      } catch (roomError) {
        console.error('❌ Error processing rooms:', roomError)
        throw roomError
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
    const finalEstimate = await prisma.estimates.findUnique({
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
    let formattedRooms: any[] = []
    if (finalEstimate?.rooms && finalEstimate.type === 'rooms') {
      // Для смет типа "rooms" форматируем помещения с worksBlock и materialsBlock
      formattedRooms = finalEstimate.rooms.map((room: any) => {
        // Группируем работы по блокам
        const worksByBlock: { [key: string]: any } = {}
        room.works.forEach((work: any) => {
          const blockTitle = work.blockTitle || work.workItem?.blockTitle || 'Без категории'
          if (!worksByBlock[blockTitle]) {
            worksByBlock[blockTitle] = {
              id: `block_${blockTitle.replace(/\s+/g, '_')}`,
              title: blockTitle,
              items: [],
              totalPrice: 0
            }
          }
          
          const workName = work.workItem?.name || work.manualWorkName || 'Без названия'
          const workUnit = work.workItem?.unit || work.manualWorkUnit || 'шт'
          
          worksByBlock[blockTitle].items.push({
            id: work.id,
            workId: work.workItemId,
            name: workName,
            unit: workUnit,
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

        return {
          id: room.id,
          name: room.name,
          totalWorksPrice: room.totalWorksPrice,
          totalMaterialsPrice: room.totalMaterialsPrice,
          totalPrice: room.totalPrice,
          worksBlock: {
            id: `works_${room.id}`,
            title: `Работы - ${room.name}`,
            blocks: Object.values(worksByBlock),
            totalPrice: room.totalWorksPrice
          },
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
          },
          roomParameterValues: room.roomParameterValues?.map((rpv: any) => ({
            ...rpv,
            parameter: rpv.parameter
          })) || [],
          roomParameters: {
            id: `room_params_${room.id}`,
            title: `Параметры помещения - ${room.name}`,
            parameters: room.roomParameterValues?.map((rpv: any) => ({
              parameterId: rpv.parameterId,
              value: rpv.value,
              parameter: rpv.parameter
            })) || []
          }
        }
      })
    } else if (finalEstimate?.rooms) {
      // Для других типов смет используем простое форматирование
      formattedRooms = finalEstimate.rooms.map(formatRoomForFrontend)
    }

    const formattedEstimate: any = {
      ...finalEstimate,
      rooms: formattedRooms,
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
      summaryMaterialsBlock: finalEstimate?.summaryMaterialsBlock ? JSON.parse(finalEstimate.summaryMaterialsBlock) : null,
      // Добавляем глобальные параметры помещений (для сводной сметы)
      roomParameters: (finalEstimate?.roomParameterValues && finalEstimate.roomParameterValues.filter((rpv: any) => rpv.roomId === null).length > 0) ? {
        id: `room_params_summary_${finalEstimate.id}`,
        title: 'Параметры сводной сметы',
        parameters: finalEstimate.roomParameterValues.filter((rpv: any) => rpv.roomId === null).map((rpv: any) => ({
          parameterId: rpv.parameterId,
          value: rpv.value,
          parameter: rpv.parameter
        }))
      } : null
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
    
    // Подробное логирование для отладки
    if (error instanceof Error) {
      console.error('Error name:', error.name)
    }
    
    // Логирование Prisma ошибок
    if (error && typeof error === 'object' && 'code' in error) {
      console.error('Prisma error code:', (error as any).code)
      console.error('Prisma error meta:', (error as any).meta)
      
      // Более понятные сообщения для пользователя
      if ((error as any).code === 'P2003') {
        return NextResponse.json(
          { error: 'Ошибка: найдены ссылки на несуществующие работы в справочнике. Проверьте корректность данных.' },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { error: 'Ошибка обновления сметы' },
      { status: 500 }
    )
  }
}

// PATCH метод для обновления названия сметы
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию (только админы и менеджеры)
    const session = checkAuth(request)
    
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }
    
    // Внешние дизайнеры не имеют доступа к основным сметам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    const body = await request.json()
    const { title } = body

    if (!title?.trim()) {
      return NextResponse.json(
        { error: 'Название сметы обязательно' },
        { status: 400 }
      )
    }

    // Получаем смету для проверки прав доступа
    const estimate = await (prisma as any).estimate.findUnique({
      where: { id: params.id },
      include: {
        client: true
      }
    })

    if (!estimate) {
      return NextResponse.json(
        { error: 'Смета не найдена' },
        { status: 404 }
      )
    }

    // Для менеджеров проверяем права доступа к клиенту
    if (session.role === 'MANAGER' && estimate.client.createdBy !== session.id) {
      return NextResponse.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      )
    }

    // Обновляем название сметы
    const updatedEstimate = await (prisma as any).estimate.update({
      where: { id: params.id },
      data: { 
        title: title.trim(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Название сметы успешно обновлено',
      title: updatedEstimate.title
    })
  } catch (error) {
    console.error('Ошибка обновления названия сметы:', error)
    return NextResponse.json(
      { error: 'Ошибка обновления названия сметы' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Проверяем авторизацию (только админы могут удалять)
    const session = checkAuth(request)
    if (!session) {
      return NextResponse.json(
        { error: 'Не авторизован' },
        { status: 401 }
      )
    }
    
    // Внешние дизайнеры не имеют доступа к основным сметам
    if (!canAccessMainSystem(session)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 })
    }

    // Получаем смету с полными данными перед удалением
    const estimate = await prisma.estimates.findUnique({
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
    await prisma.estimates.delete({
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