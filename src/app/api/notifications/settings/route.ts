import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { classifyError } from '@/lib/api-error'

// GET /api/notifications/settings?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const accountId = req.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const userId = req.nextUrl.searchParams.get('userId')
    if (!userId) {
      return NextResponse.json(
        { error: 'userId wajib' },
        { status: 400 }
      )
    }

    let setting = await db.notificationSetting.findFirst({
      where: { userId, accountId },
    })

    // Auto-create if not exists
    if (!setting) {
      setting = await db.notificationSetting.create({
        data: { userId, accountId },
      })
    }

    return NextResponse.json({ data: setting })
  } catch (error) {
    return classifyError(error)
  }
}

// PUT /api/notifications/settings
export async function PUT(req: NextRequest) {
  try {
    const accountId = req.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const body = await req.json()
    const { userId, ...settings } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId wajib' },
        { status: 400 }
      )
    }

    // Find existing setting for this account
    const existing = await db.notificationSetting.findFirst({
      where: { userId, accountId },
    })

    let setting
    if (existing) {
      setting = await db.notificationSetting.update({
        where: { id: existing.id },
        data: settings,
      })
    } else {
      setting = await db.notificationSetting.create({
        data: { userId, accountId, ...settings },
      })
    }

    return NextResponse.json({ data: setting })
  } catch (error) {
    return classifyError(error)
  }
}
