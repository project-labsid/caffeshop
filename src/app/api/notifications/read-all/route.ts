import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classifyError } from '@/lib/api-error'

// PUT /api/notifications/read-all
export async function PUT(req: NextRequest) {
  try {
    const accountId = req.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    await db.notification.updateMany({
      where: { accountId, isRead: false },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return classifyError(error)
  }
}
