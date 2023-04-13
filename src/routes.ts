import dayjs from 'dayjs'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from './lib/prisma'

export async function appRoutes(app: FastifyInstance) {
  app.post('/habits', async (request) => {
    const createHabitBody = z.object({
      title: z.string(), 
      daysOfWeek: z.array(
        z.number().min(0).max(6)
      )
    })

    const { title, daysOfWeek } = createHabitBody.parse(request.body)

    const today = dayjs().startOf('day').toDate()

    await prisma.habit.create({
      data: {
        title, 
        created_at: today,
        daysOfWeek: {
          create: daysOfWeek.map(weekDay => {
            return {
              day_of_week: weekDay
            }
          })
        }
      }
    })
  })

  /**
   * This method was created to provide the habits for a given day
   * @param date Timestamp to be used to query the date
   * @returns possibleHabits, completedHabits All possible habits to be completed 
   * for the date as well as the current completed habits
   */
  app.get('/day', async (request) => {
    const getDayParams = z.object({
      date: z.coerce.date()
    })

    const { date } =  getDayParams.parse(request.query)
    const parsedDate = dayjs(date).startOf('day')
    const dayOfWeek = parsedDate.get('day')

    const possibleHabits = await prisma.habit.findMany({
      where: {
        created_at: {
          lte: date
        }, 
        daysOfWeek: {
          some: {
            day_of_week: dayOfWeek
          }
        }
      }
    })

    const day = await prisma.day.findUnique({
      where: {
        date: parsedDate.toDate()
      }, 
      include: {
        dayHabits: true
      }
    })

    const completedHabits = day?.dayHabits.map( dayHabit => {
      return dayHabit.habit_id
    })

    return {
      possibleHabits, 
      completedHabits
    }
  })

  app.get('/', () => {
    return 'Hello! =)'
  })
}