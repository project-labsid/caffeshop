import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/dashboard - Return dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      // Return empty dashboard data when not authenticated
      return NextResponse.json({
        data: {
          todaySales: 0, monthSales: 0, totalRevenue: 0,
          totalProducts: 0, totalCustomers: 0, totalSuppliers: 0, totalBranches: 0, totalTransactions: 0,
          topProducts: [], recentTransactions: [], lowStockProducts: [],
          salesChartData: [], revenueChartData: [],
        },
      })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Helper: safe query with fallback
    async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
      try {
        return await fn()
      } catch {
        return fallback
      }
    }

    // Run all queries in parallel, each with its own fallback
    const [
      todaySalesResult,
      monthSalesResult,
      totalRevenueResult,
      totalProducts,
      totalCustomers,
      totalSuppliers,
      totalBranches,
      totalTransactions,
      topProducts,
      recentTransactions,
      lowStockProducts,
      salesChartData,
    ] = await Promise.all([
      safeQuery(
        () => db.transaction.aggregate({
          where: { accountId, status: 'completed', type: 'sale', createdAt: { gte: today } },
          _sum: { grandTotal: true },
          _count: true,
        }),
        { _sum: { grandTotal: 0 }, _count: 0 }
      ),

      safeQuery(
        () => db.transaction.aggregate({
          where: { accountId, status: 'completed', type: 'sale', createdAt: { gte: startOfMonth } },
          _sum: { grandTotal: true },
          _count: true,
        }),
        { _sum: { grandTotal: 0 }, _count: 0 }
      ),

      safeQuery(
        () => db.transaction.aggregate({
          where: { accountId, status: 'completed', type: 'sale' },
          _sum: { grandTotal: true },
        }),
        { _sum: { grandTotal: 0 } }
      ),

      safeQuery(() => db.product.count({ where: { accountId, isActive: true } }), 0),
      safeQuery(() => db.customer.count({ where: { accountId, isActive: true } }), 0),
      safeQuery(() => db.supplier.count({ where: { accountId, isActive: true } }), 0),
      safeQuery(() => db.branch.count({ where: { accountId, isActive: true } }), 0),
      safeQuery(() => db.transaction.count({ where: { accountId } }), 0),

      safeQuery(
        () => db.transactionItem.groupBy({
          by: ['productId', 'productName'],
          where: {
            transaction: { accountId, status: 'completed', type: 'sale' },
          },
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
        []
      ),

      safeQuery(
        () => db.transaction.findMany({
          where: { accountId },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true } },
            customer: { select: { id: true, name: true } },
          },
        }),
        []
      ),

      safeQuery(
        () => db.product.findMany({
          where: { accountId, isActive: true },
          take: 50,
          orderBy: { stock: 'asc' },
          include: { category: true },
        }),
        []
      ),

      safeQuery(
        () => db.transaction.findMany({
          where: { accountId, status: 'completed', type: 'sale', createdAt: { gte: thirtyDaysAgo } },
          select: { createdAt: true, grandTotal: true },
        }),
        []
      ),
    ])

    // Process sales chart data
    const dailyMap = new Map<string, { total: number; count: number }>()
    for (const tx of salesChartData) {
      const dateStr = tx.createdAt.toISOString().split('T')[0]
      const existing = dailyMap.get(dateStr)
      if (existing) {
        existing.total += tx.grandTotal
        existing.count += 1
      } else {
        dailyMap.set(dateStr, { total: tx.grandTotal, count: 1 })
      }
    }

    // Fill in missing dates for last 30 days
    const chartData: Array<{ date: string; total: number }> = []
    const forDate = new Date(thirtyDaysAgo)
    while (forDate <= today) {
      const dateStr = forDate.toISOString().split('T')[0]
      const dayData = dailyMap.get(dateStr)
      chartData.push({ date: dateStr, total: dayData?.total ?? 0 })
      forDate.setDate(forDate.getDate() + 1)
    }

    const filteredLowStock = lowStockProducts.filter((p) => p.stock <= p.minStock)

    return NextResponse.json({
      data: {
        todaySales: (todaySalesResult as any)._sum?.grandTotal ?? 0,
        todayTransactions: (todaySalesResult as any)._count ?? 0,
        monthSales: (monthSalesResult as any)._sum?.grandTotal ?? 0,
        monthTransactions: (monthSalesResult as any)._count ?? 0,
        totalRevenue: (totalRevenueResult as any)._sum?.grandTotal ?? 0,
        totalProducts,
        totalCustomers,
        totalSuppliers,
        totalBranches,
        totalTransactions,
        topProducts,
        recentTransactions,
        lowStockProducts: filteredLowStock,
        salesChartData: chartData,
        revenueChartData: chartData,
      },
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Terjadi kesalahan server', details: message },
      { status: 500 }
    )
  }
}
