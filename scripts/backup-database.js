const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function createBackup() {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').split('.')[0];
    const backupDir = path.join(__dirname, '..', 'backups');
    
    // Создаем папку backups если её нет
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log('🔄 Начинаю создание бэкапа базы данных...');
    console.log(`📅 Время: ${new Date().toLocaleString('ru-RU')}`);

    // Получаем все данные из основных таблиц
    const [
      users,
      clients,
      clientUsers,
      estimates,
      estimateRooms,
      estimateWorks,
      estimateMaterials,
      estimateCoefficients,
      estimateRoomParameterValues,
      acts,
      actRooms,
      actWorks,
      actMaterials,
      actCoefficients,
      actRoomParameterValues,
      workItems,
      workBlocks,
      coefficients,
      roomParameters,
      documents,
      projectNews,
      photoBlocks,
      photos,
      receiptBlocks,
      receipts,
      scheduleProjects,
      scheduleTasks,
      projectScheduleItems
    ] = await Promise.all([
      prisma.user.findMany(),
      prisma.client.findMany(),
      prisma.clientUser.findMany(),
      prisma.estimate.findMany(),
      prisma.estimateRoom.findMany(),
      prisma.estimateWork.findMany(),
      prisma.estimateMaterial.findMany(),
      prisma.estimateCoefficient.findMany(),
      prisma.estimateRoomParameterValue.findMany(),
      prisma.act.findMany(),
      prisma.actRoom.findMany(),
      prisma.actWork.findMany(),
      prisma.actMaterial.findMany(),
      prisma.actCoefficient.findMany(),
      prisma.actRoomParameterValue.findMany(),
      prisma.workItem.findMany(),
      prisma.workBlock.findMany(),
      prisma.coefficient.findMany(),
      prisma.roomParameter.findMany(),
      prisma.document.findMany(),
      prisma.projectNews.findMany(),
      prisma.photoBlock.findMany(),
      prisma.photo.findMany(),
      prisma.receiptBlock.findMany(),
      prisma.receipt.findMany(),
      prisma.scheduleProject.findMany(),
      prisma.scheduleTask.findMany(),
      prisma.projectScheduleItem.findMany()
    ]);

    const backup = {
      metadata: {
        timestamp,
        version: '1.0',
        description: 'Полный бэкап базы данных AEY Estimates',
        createdAt: new Date().toISOString(),
        tables: {
          users: users.length,
          clients: clients.length,
          clientUsers: clientUsers.length,
          estimates: estimates.length,
          estimateRooms: estimateRooms.length,
          estimateWorks: estimateWorks.length,
          estimateMaterials: estimateMaterials.length,
          estimateCoefficients: estimateCoefficients.length,
          estimateRoomParameterValues: estimateRoomParameterValues.length,
          acts: acts.length,
          actRooms: actRooms.length,
          actWorks: actWorks.length,
          actMaterials: actMaterials.length,
          actCoefficients: actCoefficients.length,
          actRoomParameterValues: actRoomParameterValues.length,
          workItems: workItems.length,
          workBlocks: workBlocks.length,
          coefficients: coefficients.length,
          roomParameters: roomParameters.length,
          documents: documents.length,
          projectNews: projectNews.length,
          photoBlocks: photoBlocks.length,
          photos: photos.length,
          receiptBlocks: receiptBlocks.length,
          receipts: receipts.length,
          scheduleProjects: scheduleProjects.length,
          scheduleTasks: scheduleTasks.length,
          projectScheduleItems: projectScheduleItems.length
        }
      },
      data: {
        users,
        clients,
        clientUsers,
        estimates,
        estimateRooms,
        estimateWorks,
        estimateMaterials,
        estimateCoefficients,
        estimateRoomParameterValues,
        acts,
        actRooms,
        actWorks,
        actMaterials,
        actCoefficients,
        actRoomParameterValues,
        workItems,
        workBlocks,
        coefficients,
        roomParameters,
        documents,
        projectNews,
        photoBlocks,
        photos,
        receiptBlocks,
        receipts,
        scheduleProjects,
        scheduleTasks,
        projectScheduleItems
      }
    };

    // Сохраняем бэкап
    const backupFileName = `backup_${timestamp}.json`;
    const backupPath = path.join(backupDir, backupFileName);
    
    fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');

    // Создаем также сжатый бэкап
    const compressedBackupPath = path.join(backupDir, `backup_${timestamp}_compressed.json`);
    fs.writeFileSync(compressedBackupPath, JSON.stringify(backup), 'utf8');

    console.log('\n✅ Бэкап успешно создан!');
    console.log(`📁 Путь: ${backupPath}`);
    console.log(`📁 Сжатый: ${compressedBackupPath}`);
    
    const stats = fs.statSync(backupPath);
    const compressedStats = fs.statSync(compressedBackupPath);
    
    console.log(`📊 Размер: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Сжатый: ${(compressedStats.size / 1024 / 1024).toFixed(2)} MB`);

    console.log('\n📋 Статистика данных:');
    Object.entries(backup.metadata.tables).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   - ${table}: ${count} записей`);
      }
    });

    // Очищаем старые бэкапы (оставляем последние 10)
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('backup_') && file.endsWith('.json'))
      .sort()
      .reverse();

    if (backupFiles.length > 20) { // 10 обычных + 10 сжатых
      const filesToDelete = backupFiles.slice(20);
      console.log(`\n🧹 Удаляю старые бэкапы: ${filesToDelete.length} файлов`);
      filesToDelete.forEach(file => {
        fs.unlinkSync(path.join(backupDir, file));
        console.log(`   - Удален: ${file}`);
      });
    }

    console.log('\n🎉 Бэкап завершен!');
    return backupPath;

  } catch (error) {
    console.error('💥 Ошибка при создании бэкапа:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем если файл вызван напрямую
if (require.main === module) {
  createBackup()
    .then(backupPath => {
      console.log(`\n✅ Бэкап сохранен: ${backupPath}`);
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Ошибка:', error.message);
      process.exit(1);
    });
}

module.exports = { createBackup }; 