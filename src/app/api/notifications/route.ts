import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classifyError } from '@/lib/api-error'

// GET /api/notifications?unreadOnly=true&limit=20
export async function GET(req: NextRequest) {
  try {
    const accountId = req.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const { searchParams } = req.nextUrl
    const unreadOnly = searchParams.get('unreadOnly') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const type = searchParams.get('type')

    const where: Record<string, unknown> = { accountId }
    if (unreadOnly) where.isRead = false
    if (type) where.type = type

    const notifications = await db.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    const unreadCount = await db.notification.count({
      where: { accountId, isRead: false },
    })

    return NextResponse.json({
      data: notifications,
      unreadCount,
    })
  } catch (error) {
    return classifyError(error)
  }
}

// POST /api/notifications — create a notification (for manual/testing use)
export async function POST(req: NextRequest) {
  try {
    const accountId = req.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const body = await req.json()
    const { type, title, message, userId, data } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'title dan message wajib diisi' },
        { status: 400 }
      )
    }

    const notification = await db.notification.create({
      data: {
        type: type || 'system',
        title,
        message,
        userId: userId || null,
        accountId,
        data: data ? JSON.stringify(data) : null,
      },
    })

    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (error) {
    return classifyError(error)
  }
}

// DELETE /api/notifications?olderThan=7 (days)
export async function DELETE(req: NextRequest) {
  try {
    const accountId = req.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const { searchParams } = req.nextUrl
    const olderThanDays = parseInt(searchParams.get('olderThan') || '30', 10)

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - olderThanDays)

    const result = await db.notification.deleteMany({
      where: { accountId, createdAt: { lt: cutoff } },
    })

    return NextResponse.json({ deleted: result.count })
  } catch (error) {
    return classifyError(error)
  }
}
