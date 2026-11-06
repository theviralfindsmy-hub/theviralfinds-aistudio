import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit-enforce'
import { handleError } from '@/lib/api-error'
import { validateBody } from '@/lib/validation'
import { z } from 'zod'

const createSkillSchema = z.object({
  name: z.string().min(1, 'name is required').max(200),
  description: z.string().min(1, 'description is required').max(2000),
  category: z.string().min(1, 'category is required').max(100),
  code: z.string().min(1, 'code is required').max(50_000),
  trigger: z.string().max(500).optional().nullable(),
  status: z.enum(['draft', 'active', 'paused', 'archived']).optional(),
  learnedFrom: z.string().max(500).optional().nullable(),
})

export async function GET(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.read)) {
      return enforceRateLimit(request, RATE_LIMITS.read)!
    }
    const skills = await db.hermesSkill.findMany({
      orderBy: { createdAt: 'desc' },
    })

    const formattedSkills = skills.map((skill) => ({
      ...skill,
      successRate: skill.successRate ? Number(skill.successRate) : null,
    }))

    return NextResponse.json({ skills: formattedSkills, total: formattedSkills.length })
  } catch (error) {
    return handleError(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    if (enforceRateLimit(request, RATE_LIMITS.write)) {
      return enforceRateLimit(request, RATE_LIMITS.write)!
    }
    const data = await validateBody(request, createSkillSchema)

    const skill = await db.hermesSkill.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        code: data.code,
        trigger: data.trigger || null,
        status: data.status || 'draft',
        learnedFrom: data.learnedFrom || null,
      },
    })

    return NextResponse.json(
      {
        ...skill,
        successRate: skill.successRate ? Number(skill.successRate) : null,
      },
      { status: 201 }
    )
  } catch (error) {
    return handleError(error)
  }
}
