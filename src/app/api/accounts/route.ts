import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/accounts - List all accounts with user counts (super_admin only)
export async function GET(request: NextRequest) {
  try {
    const userRole = request.headers.get('x-user-role')
    if (userRole !== 'super_admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const accounts = await db.account.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'asc' },
        },
        _count: {
          select: {
            users: true,
            products: true,
            transactions: true,
            branches: true,
          },
        },
      },
    })

    return NextResponse.json({ data: accounts })
  } catch (error) {
    console.error('Accounts list error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
