import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const getUsageSchema = z.object({
  userId: z.string().min(1, 'User ID wajib diisi'),
})

const logUsageSchema = z.object({
  userId: z.string().min(1, 'User ID wajib diisi'),
  type: z.enum(['chat', 'summary', 'analysis', 'prediction', 'restock', 'insight']),
  tokensUsed: z.number().int().min(0).default(0),
  modelUsed: z.string().optional(),
  provider: z.string().optional(),
  cost: z.number().min(0).default(0),
})

function getWibDayRange() {
  const now = new Date()
  const wibOffset = 7 * 60 * 60 * 1000
  const wibNow = new Date(now.getTime() + wibOffset)

  const dayStart = new Date(Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth(),
    wibNow.getUTCDate(),
    0 - 7, 0, 0, 0
  ))
  const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)

  return { dayStart, dayEnd }
}

function getWibMonthRange() {
  const now = new Date()
  const wibOffset = 7 * 60 * 60 * 1000
  const wibNow = new Date(now.getTime() + wibOffset)

  const monthStart = new Date(Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth(),
    1,
    0 - 7, 0, 0, 0
  ))

  return { monthStart }
}

// GET /api/ai/usage - Return AI usage stats for current user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = getUsageSchema.safeParse(Object.fromEntries(searchParams))

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const userId = parsed.data.userId

    // Get active subscription with plan to know quotas
    const subscription = await db.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    const plan = subscription?.plan ?? null
    const dailyQuota = plan?.aiChatDaily ?? 10
    const monthlyQuota = plan?.aiChatMonthly ?? 300

    // Count daily usage (WIB timezone)
    const { dayStart, dayEnd } = getWibDayRange()
    const dailyCount = await db.aiUsage.count({
      where: {
        userId,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    })

    // Count monthly usage (WIB timezone)
    const { monthStart } = getWibMonthRange()
    const monthlyCount = await db.aiUsage.count({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
    })

    // Get total tokens used today and this month
    const dailyTokens = await db.aiUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
      _sum: { tokensUsed: true },
    })

    const monthlyTokens = await db.aiUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
      _sum: { tokensUsed: true },
    })

    // Get total cost this month
    const monthlyCost = await db.aiUsage.aggregate({
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
      _sum: { cost: true },
    })

    // Breakdown by type
    const typeBreakdown = await db.aiUsage.groupBy({
      by: ['type'],
      where: {
        userId,
        createdAt: { gte: monthStart },
      },
      _count: { type: true },
    })

    return NextResponse.json({
      data: {
        daily: {
          count: dailyCount,
          quota: dailyQuota,
          remaining: Math.max(0, dailyQuota - dailyCount),
          percentage: dailyQuota > 0 ? Math.round((dailyCount / dailyQuota) * 100) : 0,
          tokensUsed: dailyTokens._sum.tokensUsed ?? 0,
        },
        monthly: {
          count: monthlyCount,
          quota: monthlyQuota,
          remaining: Math.max(0, monthlyQuota - monthlyCount),
          percentage: monthlyQuota > 0 ? Math.round((monthlyCount / monthlyQuota) * 100) : 0,
          tokensUsed: monthlyTokens._sum.tokensUsed ?? 0,
          cost: monthlyCost._sum.cost ?? 0,
        },
        breakdown: typeBreakdown.map((b) => ({
          type: b.type,
          count: b._count.type,
        })),
        plan: plan ? {
          name: plan.name,
          dailyQuota: plan.aiChatDaily,
          monthlyQuota: plan.aiChatMonthly,
        } : null,
      },
    })
  } catch (error) {
    console.error('Get AI usage error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/ai/usage - Log AI usage
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = logUsageSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { userId, type, tokensUsed, modelUsed, provider, cost } = parsed.data

    // Check daily quota before logging
    const subscription = await db.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: { plan: true },
      orderBy: { createdAt: 'desc' },
    })

    const dailyQuota = subscription?.plan?.aiChatDaily ?? 10

    const { dayStart, dayEnd } = getWibDayRange()
    const dailyCount = await db.aiUsage.count({
      where: {
        userId,
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    })

    if (dailyCount >= dailyQuota) {
      return NextResponse.json(
        { error: 'Kuota AI harian telah tercapai', code: 'QUOTA_EXCEEDED' },
        { status: 429 }
      )
    }

    // Create AI usage record
    const aiUsage = await db.aiUsage.create({
      data: {
        userId,
        type,
        tokensUsed,
        modelUsed,
        provider,
        cost,
      },
    })

    // Update subscription usage metrics
    if (subscription) {
      await db.subscriptionUsage.updateMany({
        where: {
          subscriptionId: subscription.id,
          metric: 'ai_daily',
        },
        data: {
          currentValue: dailyCount + 1,
          maxValue: dailyQuota,
          resetAt: getEndOfDay(),
        },
      })

      // Update monthly count
      const { monthStart } = getWibMonthRange()
      const monthlyCount = await db.aiUsage.count({
        where: {
          userId,
          createdAt: { gte: monthStart },
        },
      })

      await db.subscriptionUsage.updateMany({
        where: {
          subscriptionId: subscription.id,
          metric: 'ai_monthly',
        },
        data: {
          currentValue: monthlyCount,
          maxValue: subscription.plan.aiChatMonthly,
          resetAt: getEndOfMonth(),
        },
      })
    }

    return NextResponse.json({ data: aiUsage }, { status: 201 })
  } catch (error) {
    console.error('Log AI usage error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

function getEndOfDay(): Date {
  const now = new Date()
  const wibOffset = 7 * 60 * 60 * 1000
  const wibNow = new Date(now.getTime() + wibOffset)
  return new Date(Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth(),
    wibNow.getUTCDate(),
    24 - 7, 0, 0, 0
  ))
}

function getEndOfMonth(): Date {
  const now = new Date()
  const wibOffset = 7 * 60 * 60 * 1000
  const wibNow = new Date(now.getTime() + wibOffset)
  return new Date(Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth() + 1,
    0,
    24 - 7, 0, 0, 0
  ))
}
