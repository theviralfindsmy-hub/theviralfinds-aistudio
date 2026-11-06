import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'
import { validateBody } from '@/lib/validation'
import { z } from 'zod'

const createTaskSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
  description: z.string().max(2000).optional().nullable(),
  schedule: z.string().max(200).optional().nullable(),
  skillId: z.string().max(100).optional().nullable(),
  status: z.enum(['scheduled', 'running', 'completed', 'failed', 'paused']).optional(),
  nextRunAt: z.string().datetime().optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const tasks = await db.hermesTask.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const formattedTasks = tasks.map((task) => ({
      ...task,
      lastRunAt: task.lastRunAt ? task.lastRunAt.toISOString() : null,
      nextRunAt: task.nextRunAt ? task.nextRunAt.toISOString() : null,
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString(),
    }))

    return NextResponse.json({ tasks: formattedTasks, total: formattedTasks.length })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const data = await validateBody(request, createTaskSchema)

    const task = await db.hermesTask.create({
      data: {
        name: data.name,
        description: data.description || null,
        schedule: data.schedule || null,
        skillId: data.skillId || null,
        status: data.status || 'scheduled',
        nextRunAt: data.nextRunAt ? new Date(data.nextRunAt) : null,
      },
    })

    return NextResponse.json(
      {
        ...task,
        lastRunAt: task.lastRunAt ? task.lastRunAt.toISOString() : null,
        nextRunAt: task.nextRunAt ? task.nextRunAt.toISOString() : null,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
}
