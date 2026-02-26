import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const username = 'designer'
  const password = '123456'
  const name = 'Дизайнер'

  const existingUser = await prisma.user.findUnique({
    where: { username }
  })

  if (existingUser) {
    console.log('❌ Пользователь с username "designer" уже существует')
    console.log('Обновляю роль на DESIGNER...')
    
    await prisma.user.update({
      where: { id: existingUser.id },
      data: { role: 'DESIGNER' }
    })
    
    console.log('✅ Роль пользователя обновлена на DESIGNER')
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: {
      username,
      passwordHash,
      name,
      role: 'DESIGNER',
      isActive: true
    }
  })

  console.log('✅ Пользователь-дизайнер создан:')
  console.log(`   Username: ${username}`)
  console.log(`   Password: ${password}`)
  console.log(`   Роль: DESIGNER`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
