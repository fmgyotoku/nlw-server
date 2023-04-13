import Fastify from "fastify"
import cors from '@fastify/cors'
import { appRoutes } from "./routes"

const app = Fastify()

app.register(cors)
app.register(appRoutes)

app.listen({
  host: '0.0.0.0', 
  port: 3333
}).then((address) => {
  console.log(`Server listening on ${address}`)
}).catch((err) => {
  console.error('Error starting server', err)
})