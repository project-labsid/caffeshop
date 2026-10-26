import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  role: z.enum(['owner', 'admin', 'cashier']).default('cashier'),
  phone: z.string().optional(),
  branchId: z.string().optional(),
  // Account fields (only for new account creation)
  accountName: z.string().optional(),
  createAccount: z.boolean().default(false),
})

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, email, password, role, phone, branchId, accountName, createAccount } = parsed.data

    // Check if this is the first user (allow super_admin creation)
    const userCount = await db.user.count()
    const isFirstUser = userCount === 0

    let accountId: string | null = null
    let isAccountOwner = false

    if (createAccount || isFirstUser) {
      // Create a new account
      const accName = accountName || `${name}'s Coffee Shop`
      let slug = generateSlug(accName)

      // Ensure slug is unique
      const existingSlug = await db.account.findUnique({ where: { slug } })
      if (existingSlug) {
        slug = `${slug}-${Date.now().toString(36)}`
      }

      const account = await db.account.create({
        data: {
          name: accName,
          slug,
          ownerEmail: email,
        },
      })

      accountId = account.id
      isAccountOwner = true
    } else {
      // Adding user to existing account - requires super_admin header
      const requesterRole = request.headers.get('x-user-role')
      const requesterAccountId = request.headers.get('x-account-id')

      if (requesterRole !== 'super_admin' && requesterRole !== 'owner' && requesterRole !== 'admin') {
        return NextResponse.json(
          { error: 'Hanya owner atau admin yang dapat mendaftarkan pengguna baru' },
          { status: 403 }
        )
      }

      if (!requesterAccountId) {
        return NextResponse.json(
          { error: 'Account ID diperlukan' },
          { status: 400 }
        )
      }

      // Verify account exists
      const account = await db.account.findUnique({ where: { id: requesterAccountId } })
      if (!account) {
        return NextResponse.json(
          { error: 'Akun tidak ditemukan' },
          { status: 404 }
        )
      }

      accountId = requesterAccountId
    }

    // Check for existing email within the same account
    const existingUser = await db.user.findFirst({
      where: { email, accountId },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar di akun ini' },
        { status: 409 }
      )
    }

    // Validate branchId if provided
    if (branchId) {
      const branch = await db.branch.findUnique({ where: { id: branchId } })
      if (!branch) {
        return NextResponse.json(
          { error: 'Cabang tidak ditemukan' },
          { status: 404 }
        )
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: isAccountOwner ? 'owner' : role,
        phone,
        branchId,
        accountId,
      },
      include: { branch: true, account: true },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        userId: user.id,
        action: isAccountOwner ? 'REGISTER_OWNER' : 'REGISTER',
        module: 'AUTH',
        details: JSON.stringify({ email: user.email, role: user.role, accountId }),
        accountId,
      },
    })

    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: isAccountOwner ? 'Akun dan pengguna berhasil dibuat' : 'Pengguna berhasil didaftarkan',
        user: userWithoutPassword,
        isNewAccount: isAccountOwner,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
