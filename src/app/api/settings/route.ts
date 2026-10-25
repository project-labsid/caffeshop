import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  settings: z.record(z.string(), z.string()),
}).refine((d) => Object.keys(d.settings).length >= 1, {
  message: 'Minimal 1 setting',
  path: ['settings'],
})

// GET /api/settings - Get all store settings as key-value pairs
export async function GET(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ data: {} })
    }

    const settings = await db.storeSetting.findMany({
      where: { accountId },
      orderBy: { key: 'asc' },
    })

    const keyValuePairs: Record<string, string> = {}
    for (const setting of settings) {
      keyValuePairs[setting.key] = setting.value
    }

    return NextResponse.json({ data: keyValuePairs })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update store settings (accept key-value pairs object)
export async function PUT(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateSettingsSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { settings } = parsed.data

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const results: any[] = []
    for (const [key, value] of Object.entries(settings)) {
      const existing = await db.storeSetting.findFirst({
        where: { key, accountId },
      })
      if (existing) {
        const result = await db.storeSetting.update({
          where: { id: existing.id },
          data: { value },
        })
        results.push(result)
      } else {
        const result = await db.storeSetting.create({
          data: { key, value, accountId },
        })
        results.push(result)
      }
    }

    return NextResponse.json({ data: results })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
