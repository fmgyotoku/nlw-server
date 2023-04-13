import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  await prisma.habit.deleteMany()

  await prisma.habit.create({
    data: {
      title: 'Drink 2 litres of water', 
      created_at: new Date('2023-04-11T13:00:00')
    }
  })
}

main()
  .then (async() => {
    await prisma.$disconnect()
  })
  .catch (async(e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })