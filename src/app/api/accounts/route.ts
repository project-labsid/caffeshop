import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/accounts - List accounts (for account selection)
export async function GET(request: NextRequest) {
  try {
    const email = request.headers.get('x-user-email')

    if (!email) {
      return NextResponse.json({ error: 'Email diperlukan' }, { status: 400 })
    }

    // Find all accounts this user belongs to
    const users = await db.user.findMany({
      where: { email },
      include: { account: true },
    })

    const accounts = users.map(u => ({
      accountId: u.accountId,
      accountName: u.account?.name || 'Unknown',
      accountSlug: u.account?.slug || '',
      role: u.role,
      isActive: u.isActive,
    }))

    return NextResponse.json({ accounts })
  } catch (error) {
    console.error('List accounts error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

// POST /api/accounts - Create a new account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, ownerEmail } = body

    if (!name || !ownerEmail) {
      return NextResponse.json(
        { error: 'Nama akun dan email pemilik wajib diisi' },
        { status: 400 }
      )
    }

    // Generate unique slug
    let slug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    const existingSlug = await db.account.findUnique({ where: { slug } })
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`
    }

    const account = await db.account.create({
      data: {
        name,
        slug,
        ownerEmail,
      },
    })

    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('Create account error:', error)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
