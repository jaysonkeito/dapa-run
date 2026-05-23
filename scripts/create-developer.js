const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const email = 'jayson.f.bsinfotech@gmail.com'
  const password = 'Jayson@10052004.'
  const name = 'Developer'
  const role = 'developer'

  // Check if developer already exists
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Developer account already exists:', email)
    if (existing.role !== 'developer') {
      // Update role to developer
      await prisma.user.update({ where: { email }, data: { role } })
      console.log('Updated existing account role to developer')
    }
    return
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12)

  // Create the developer account
  const user = await prisma.user.create({
    data: {
      email,
      name,
      password: hashedPassword,
      role,
    },
  })

  console.log('Developer account created successfully!')
  console.log('  ID:', user.id)
  console.log('  Email:', user.email)
  console.log('  Name:', user.name)
  console.log('  Role:', user.role)
}

main()
  .catch((e) => {
    console.error('Error creating developer account:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
