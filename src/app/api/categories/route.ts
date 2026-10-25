import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const createCategorySchema = z.object({
  name: z.string().min(1, 'Nama kategori wajib diisi'),
  description: z.string().optional(),
})

// GET /api/categories - List categories
export async function GET(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const categories = await db.category.findMany({
      where: { accountId },
      orderBy: { name: 'asc' },
      include: { _count: { select: { products: true } } },
    })

    return NextResponse.json({ data: categories })
  } catch (error) {
    console.error('List categories error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create category
export async function POST(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const body = await request.json()
    const parsed = createCategorySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const category = await db.category.create({
      data: { ...parsed.data, accountId },
    })

    return NextResponse.json({ data: category }, { status: 201 })
  } catch (error: unknown) {
    console.error('Create category error:', error)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        { error: 'Nama kategori sudah digunakan' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
