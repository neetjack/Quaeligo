import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const adminExists = await prisma.admin.findUnique({
    where: { username: 'admin' },
  })

  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    await prisma.admin.create({
      data: {
        username: 'admin',
        password: hashedPassword,
      },
    })
    console.log('✅ Default admin created: admin / admin123')
  } else {
    console.log('ℹ️ Admin already exists.')
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
