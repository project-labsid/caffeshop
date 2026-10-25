import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/transactions/held - Get all held transactions for current user
export async function GET(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'Parameter userId wajib diisi' },
        { status: 400 }
      )
    }

    const transactions = await db.transaction.findMany({
      where: {
        accountId,
        userId,
        status: 'held',
      },
      orderBy: { heldAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        customer: true,
        items: true,
        branch: true,
      },
    })

    return NextResponse.json({ data: transactions })
  } catch (error) {
    console.error('List held transactions error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/held?id=xxx - Delete a held transaction
export async function DELETE(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Parameter id wajib diisi' },
        { status: 400 }
      )
    }

    const transaction = await db.transaction.findFirst({
      where: { id, accountId },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaksi tidak ditemukan' },
        { status: 404 }
      )
    }

    if (transaction.status !== 'held') {
      return NextResponse.json(
        { error: 'Hanya transaksi dengan status ditahan yang bisa dihapus' },
        { status: 400 }
      )
    }

    await db.transactionItem.deleteMany({ where: { transactionId: id } })
    await db.transaction.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete held transaction error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
