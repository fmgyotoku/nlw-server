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

  /**
   * Toggle method to update the information of a habit which has been completed /
   * incompleted
   * @param id the unique identifier of the activity
   * @param date the date when the activity is being completed
   */
  app.patch('/habits/:id/toggle', async (request) => {
    const toggleHabitParams = z.object({
      id: z.string().uuid()
    })

    const toggleHabitQueryParams = z.object({
      date: z.coerce.date()
    })

    const { id } = toggleHabitParams.parse(request.params)
    const { date } = toggleHabitQueryParams.parse(request.query)
    const targetDate = dayjs(date).startOf('day').toDate()

    let day = await prisma.day.findUnique({
      where: { 
        date: targetDate
      }
    })

    if (!day) {
      day = await prisma.day.create({
        data: {
          date: targetDate
        }
      })
    }

    const dayHabit = await prisma.dayHabit.findUnique({
      where: {
        day_id_habit_id: {
          day_id: day.id, 
          habit_id: id
        }
      }
    })

    if(dayHabit) {
      await prisma.dayHabit.delete({
        where: {
          id: dayHabit.id
        }
      })
    } else {
      await prisma.dayHabit.create({
        data: {
          day_id: day.id, 
          habit_id: id
        }
      })
    }
  })

  app.get('/summary', async () => {
    const summary = await prisma.$queryRaw`
      SELECT 
        D.id, 
        D.date,
        (
          SELECT 
            cast(count(1) as float)
          FROM day_habits DH 
          WHERE DH.day_id = D.id
        ) as completed, 
        (
          SELECT 
            cast(count(1) as float)
          FROM 
            habit_days_of_week HDOW
          JOIN habits H
            ON H.id = HDOW.habit_id
          WHERE 
            HDOW.day_of_week = cast(strftime('%w', D.date/1000.0, 'unixepoch') as int)
            AND H.created_at <= D.date
        ) as amount
      FROM days D
    `

    return summary
  })

  app.get('/', () => {
    return 'Hello! =)\nIf you reach this point, your Node JS instance is working fine!'
  })
}