import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Обновляем пароль админа...');

  // Хэшируем новый пароль
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  
  // Обновляем пароль админа
  const admin = await prisma.user.update({
    where: { username: 'admin' },
    data: {
      passwordHash: adminPasswordHash
    }
  });

  console.log('✅ Пароль админа обновлен:', admin);
}

main()
  .catch((e) => {
    console.error('❌ Ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 