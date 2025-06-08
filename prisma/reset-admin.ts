import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Сбрасываем админа...');

  // Удаляем старого админа
  await prisma.user.deleteMany({
    where: { username: 'admin' }
  });

  // Создаём нового админа с правильным паролем
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      id: 'admin_1',
      username: 'admin',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      name: 'Администратор',
      phone: '',
      isActive: true
    }
  });

  console.log('✅ Новый админ создан:', admin);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 