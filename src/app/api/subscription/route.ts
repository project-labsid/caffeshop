import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  userId: z.string().min(1, 'User ID wajib diisi'),
})

const defaultPlans = [
  {
    name: 'Gratis',
    price: 0,
    period: 'monthly',
    maxProducts: 200,
    maxBranches: 1,
    maxUsers: 2,
    maxStorage: 500,
    aiChatDaily: 10,
    aiChatMonthly: 300,
    features: JSON.stringify([
      'Produk hingga 200',
      '1 Cabang',
      '2 Pengguna',
      '500 MB Storage',
      '10 AI Chat/hari',
      '300 AI Chat/bulan',
      'Laporan Penjualan',
      'Laporan Stok',
      'Manajemen Produk',
      'Struk & Invoice',
      'Pajak & Service Charge',
      'Backup Data',
      'Multi Payment Method',
      'Customer Management',
      'Barcode Scanner',
      'Activity Log',
    ]),
    isActive: true,
    sortOrder: 0,
  },
  {
    name: 'Pro',
    price: 99000,
    period: 'monthly',
    maxProducts: 5000,
    maxBranches: 5,
    maxUsers: 15,
    maxStorage: 5000,
    aiChatDaily: 100,
    aiChatMonthly: 3000,
    features: JSON.stringify([
      'Produk hingga 5.000',
      '5 Cabang',
      '15 Pengguna',
      '5 GB Storage',
      '100 AI Chat/hari',
      '3.000 AI Chat/bulan',
      'Semua fitur Gratis',
      'Laporan Lanjutan',
      'Analisis Penjualan AI',
      'Prediksi Stok AI',
      'Restock Rekomendasi',
      'Priority Support',
    ]),
    isActive: true,
    sortOrder: 1,
  },
  {
    name: 'Enterprise',
    price: 249000,
    period: 'monthly',
    maxProducts: 99999,
    maxBranches: 999,
    maxUsers: 999,
    maxStorage: 50000,
    aiChatDaily: 999,
    aiChatMonthly: 99999,
    features: JSON.stringify([
      'Produk Unlimited',
      'Cabang Unlimited',
      'Pengguna Unlimited',
      '50 GB Storage',
      'AI Chat Unlimited',
      'Semua fitur Pro',
      'API Access',
      'Custom Integration',
      'Dedicated Support',
      'Custom Branding',
      'SLA 99.9%',
      'Advanced Analytics',
      'Audit Trail',
    ]),
    isActive: true,
    sortOrder: 2,
  },
]

async function seedDefaultPlans() {
  const count = await db.subscriptionPlan.count()
  if (count === 0) {
    await db.subscriptionPlan.createMany({ data: defaultPlans })
  }
}

// GET /api/subscription - Return plans, current subscription, and usage data
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse(Object.fromEntries(searchParams))

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const userId = parsed.data.userId

    // Seed default plans if none exist
    await seedDefaultPlans()

    // Fetch all active plans
    const plans = await db.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })

    // Fetch active subscription for user
    const subscription = await db.subscription.findFirst({
      where: {
        userId,
        status: 'active',
      },
      include: {
        plan: true,
        usages: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    // If no subscription exists, auto-create one with Gratis plan
    let resultSubscription = subscription
    if (!subscription) {
      const gratisPlan = plans.find((p) => p.name === 'Gratis')
      if (gratisPlan) {
        resultSubscription = await db.subscription.create({
          data: {
            userId,
            planId: gratisPlan.id,
            status: 'active',
            usages: {
              create: [
                { metric: 'products', currentValue: 0, maxValue: gratisPlan.maxProducts },
                { metric: 'branches', currentValue: 0, maxValue: gratisPlan.maxBranches },
                { metric: 'users', currentValue: 0, maxValue: gratisPlan.maxUsers },
                { metric: 'storage', currentValue: 0, maxValue: gratisPlan.maxStorage },
                { metric: 'ai_daily', currentValue: 0, maxValue: gratisPlan.aiChatDaily, resetAt: getEndOfDay() },
                { metric: 'ai_monthly', currentValue: 0, maxValue: gratisPlan.aiChatMonthly, resetAt: getEndOfMonth() },
              ],
            },
          },
          include: {
            plan: true,
            usages: true,
          },
        })
      }
    }

    // Compute real usage counts
    const usageMetrics = await computeUsageMetrics(userId)

    // Merge real counts into usages
    if (resultSubscription) {
      resultSubscription.usages = resultSubscription.usages.map((u) => {
        if (u.metric === 'products' && usageMetrics.products !== undefined) {
          return { ...u, currentValue: usageMetrics.products }
        }
        if (u.metric === 'branches' && usageMetrics.branches !== undefined) {
          return { ...u, currentValue: usageMetrics.branches }
        }
        if (u.metric === 'users' && usageMetrics.users !== undefined) {
          return { ...u, currentValue: usageMetrics.users }
        }
        if (u.metric === 'ai_daily' && usageMetrics.aiDaily !== undefined) {
          return { ...u, currentValue: usageMetrics.aiDaily, maxValue: resultSubscription!.plan.aiChatDaily, resetAt: getEndOfDay() }
        }
        if (u.metric === 'ai_monthly' && usageMetrics.aiMonthly !== undefined) {
          return { ...u, currentValue: usageMetrics.aiMonthly, maxValue: resultSubscription!.plan.aiChatMonthly, resetAt: getEndOfMonth() }
        }
        return u
      })
    }

    return NextResponse.json({
      data: {
        plans,
        subscription: resultSubscription,
      },
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

async function computeUsageMetrics(userId: string) {
  // Count products in the user's branch (or all products if no branch filter)
  const productCount = await db.product.count({
    where: { isActive: true },
  })

  const branchCount = await db.branch.count({
    where: { isActive: true },
  })

  const userCount = await db.user.count({
    where: { isActive: true },
  })

  // AI usage today (WIB = UTC+7)
  const now = new Date()
  const todayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    0, 0, 0, 0
  ))
  // Shift to WIB: subtract 7 hours from UTC to get WIB day start in UTC terms
  // WIB day starts at UTC 17:00 (previous day)
  const wibOffset = 7 * 60 * 60 * 1000
  const wibNow = new Date(now.getTime() + wibOffset)
  const wibDayStart = new Date(Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth(),
    wibNow.getUTCDate(),
    0 - 7, 0, 0, 0 // back to UTC
  ))
  const wibDayEnd = new Date(wibDayStart.getTime() + 24 * 60 * 60 * 1000)

  const aiDailyCount = await db.aiUsage.count({
    where: {
      userId,
      createdAt: {
        gte: wibDayStart,
        lt: wibDayEnd,
      },
    },
  })

  // AI usage this month (WIB)
  const wibMonthStart = new Date(Date.UTC(
    wibNow.getUTCFullYear(),
    wibNow.getUTCMonth(),
    1,
    0 - 7, 0, 0, 0
  ))

  const aiMonthlyCount = await db.aiUsage.count({
    where: {
      userId,
      createdAt: {
        gte: wibMonthStart,
      },
    },
  })

  return {
    products: productCount,
    branches: branchCount,
    users: userCount,
    aiDaily: aiDailyCount,
    aiMonthly: aiMonthlyCount,
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
