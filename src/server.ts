import Fastify from "fastify"
import { PrismaClient } from '@prisma/client'
import cors from '@fastify/cors'

const app = Fastify()
const prisma = new PrismaClient()

app.register(cors)

app.get('/', () => {
  return 'Hello NLW'
})

app.get('/hello', async () => {
  const habits = await prisma.habit.findMany()

  return habits
})

app.listen({
  host: '0.0.0.0', 
  port: 3333
}).then((address) => {
  console.log(`Server listening on ${address}`)
}).catch((err) => {
  console.error('Error starting server', err)
})