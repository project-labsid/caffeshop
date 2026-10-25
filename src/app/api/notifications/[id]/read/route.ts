import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classifyError } from '@/lib/api-error'

// PUT /api/notifications/[id]/read
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const accountId = req.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const { id } = await params

    // Verify the notification belongs to this account
    const existing = await db.notification.findFirst({
      where: { id, accountId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Notifikasi tidak ditemukan' }, { status: 404 })
    }

    const notification = await db.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ data: notification })
  } catch (error) {
    return classifyError(error)
  }
}
