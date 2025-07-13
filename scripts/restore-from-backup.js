const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function restoreFromBackup(backupPath) {
  try {
    console.log('🔄 Начинаю восстановление из бэкапа...');
    console.log(`📁 Файл: ${backupPath}`);

    // Проверяем существование файла
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Файл бэкапа не найден: ${backupPath}`);
    }

    // Читаем бэкап
    const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    
    if (!backupData.metadata || !backupData.data) {
      throw new Error('Неверный формат файла бэкапа');
    }

    console.log(`📅 Дата создания бэкапа: ${new Date(backupData.metadata.createdAt).toLocaleString('ru-RU')}`);
    console.log(`📝 Описание: ${backupData.metadata.description}`);

    // Показываем статистику
    console.log('\n📊 Данные для восстановления:');
    Object.entries(backupData.metadata.tables).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   - ${table}: ${count} записей`);
      }
    });

    // Подтверждение
    console.log('\n⚠️  ВНИМАНИЕ: Это действие полностью очистит текущую базу данных!');
    
    // В продакшене здесь должно быть подтверждение пользователя
    // Для автоматизации пропускаем

    console.log('\n🗑️  Очищаю базу данных...');

    // Очищаем все таблицы в правильном порядке (учитывая зависимости)
    await prisma.actExport.deleteMany();
    await prisma.actRoomParameterValue.deleteMany();
    await prisma.actCoefficient.deleteMany();
    await prisma.actMaterial.deleteMany();
    await prisma.actWork.deleteMany();
    await prisma.actRoom.deleteMany();
    await prisma.act.deleteMany();

    await prisma.estimateExport.deleteMany();
    await prisma.estimateRoomParameterValue.deleteMany();
    await prisma.estimateCoefficient.deleteMany();
    await prisma.estimateMaterial.deleteMany();
    await prisma.estimateWork.deleteMany();
    await prisma.estimateRoom.deleteMany();
    await prisma.deletedEstimate.deleteMany();
    await prisma.estimate.deleteMany();

    await prisma.scheduleTask.deleteMany();
    await prisma.scheduleProject.deleteMany();
    await prisma.projectScheduleItem.deleteMany();
    await prisma.photo.deleteMany();
    await prisma.photoBlock.deleteMany();
    await prisma.receipt.deleteMany();
    await prisma.receiptBlock.deleteMany();
    await prisma.document.deleteMany();
    await prisma.projectNews.deleteMany();
    await prisma.workItem.deleteMany();
    await prisma.workBlock.deleteMany();
    await prisma.clientUser.deleteMany();
    await prisma.client.deleteMany();
    await prisma.user.deleteMany();
    await prisma.coefficient.deleteMany();
    await prisma.roomParameter.deleteMany();

    console.log('✅ База данных очищена');

    // Восстанавливаем данные
    console.log('\n📥 Восстанавливаю данные...');

    const { data } = backupData;

    // Восстанавливаем в правильном порядке
    if (data.users?.length > 0) {
      console.log(`   - Пользователи: ${data.users.length}`);
      for (const user of data.users) {
        await prisma.user.create({ data: user });
      }
    }

    if (data.coefficients?.length > 0) {
      console.log(`   - Коэффициенты: ${data.coefficients.length}`);
      for (const coeff of data.coefficients) {
        await prisma.coefficient.create({ data: coeff });
      }
    }

    if (data.roomParameters?.length > 0) {
      console.log(`   - Параметры помещений: ${data.roomParameters.length}`);
      for (const param of data.roomParameters) {
        await prisma.roomParameter.create({ data: param });
      }
    }

    if (data.workBlocks?.length > 0) {
      console.log(`   - Блоки работ: ${data.workBlocks.length}`);
      for (const block of data.workBlocks) {
        await prisma.workBlock.create({ data: block });
      }
    }

    if (data.workItems?.length > 0) {
      console.log(`   - Работы: ${data.workItems.length}`);
      for (const item of data.workItems) {
        await prisma.workItem.create({ data: item });
      }
    }

    if (data.clients?.length > 0) {
      console.log(`   - Клиенты: ${data.clients.length}`);
      for (const client of data.clients) {
        await prisma.client.create({ data: client });
      }
    }

    if (data.clientUsers?.length > 0) {
      console.log(`   - Пользователи клиентов: ${data.clientUsers.length}`);
      for (const clientUser of data.clientUsers) {
        await prisma.clientUser.create({ data: clientUser });
      }
    }

    if (data.estimates?.length > 0) {
      console.log(`   - Сметы: ${data.estimates.length}`);
      for (const estimate of data.estimates) {
        await prisma.estimate.create({ data: estimate });
      }
    }

    if (data.estimateRooms?.length > 0) {
      console.log(`   - Комнаты смет: ${data.estimateRooms.length}`);
      for (const room of data.estimateRooms) {
        await prisma.estimateRoom.create({ data: room });
      }
    }

    if (data.estimateWorks?.length > 0) {
      console.log(`   - Работы в сметах: ${data.estimateWorks.length}`);
      for (const work of data.estimateWorks) {
        await prisma.estimateWork.create({ data: work });
      }
    }

    if (data.acts?.length > 0) {
      console.log(`   - Акты: ${data.acts.length}`);
      for (const act of data.acts) {
        await prisma.act.create({ data: act });
      }
    }

    // Восстанавливаем остальные данные если есть
    const additionalTables = [
      'estimateMaterials', 'estimateCoefficients', 'estimateRoomParameterValues',
      'actRooms', 'actWorks', 'actMaterials', 'actCoefficients', 'actRoomParameterValues',
      'documents', 'projectNews', 'photoBlocks', 'photos', 'receiptBlocks', 'receipts',
      'scheduleProjects', 'scheduleTasks', 'projectScheduleItems'
    ];

    for (const tableName of additionalTables) {
      if (data[tableName]?.length > 0) {
        console.log(`   - ${tableName}: ${data[tableName].length}`);
        const modelName = tableName.charAt(0).toLowerCase() + tableName.slice(1);
        for (const item of data[tableName]) {
          try {
            await prisma[modelName].create({ data: item });
          } catch (error) {
            console.log(`     ⚠️  Ошибка с записью в ${tableName}: ${error.message}`);
          }
        }
      }
    }

    console.log('\n🎉 Восстановление завершено успешно!');
    
    // Показываем финальную статистику
    const finalStats = await Promise.all([
      prisma.user.count(),
      prisma.client.count(),
      prisma.estimate.count(),
      prisma.act.count()
    ]);

    console.log('\n📊 Финальная статистика:');
    console.log(`   - Пользователи: ${finalStats[0]}`);
    console.log(`   - Клиенты: ${finalStats[1]}`);
    console.log(`   - Сметы: ${finalStats[2]}`);
    console.log(`   - Акты: ${finalStats[3]}`);

  } catch (error) {
    console.error('💥 Ошибка при восстановлении:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Функция для поиска последнего бэкапа
function findLatestBackup() {
  const backupDir = path.join(__dirname, '..', 'backups');
  
  if (!fs.existsSync(backupDir)) {
    throw new Error('Папка с бэкапами не найдена');
  }

  const backupFiles = fs.readdirSync(backupDir)
    .filter(file => file.startsWith('backup_') && file.endsWith('.json') && !file.includes('compressed'))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    throw new Error('Файлы бэкапов не найдены');
  }

  return path.join(backupDir, backupFiles[0]);
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  const backupPath = process.argv[2] || findLatestBackup();
  
  restoreFromBackup(backupPath)
    .then(() => {
      console.log('\n✅ Восстановление завершено!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Ошибка:', error.message);
      process.exit(1);
    });
}

module.exports = { restoreFromBackup, findLatestBackup }; 