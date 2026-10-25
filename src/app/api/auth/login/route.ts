import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = loginSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validasi gagal', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data

    // Find user by email - could be in multiple accounts
    const users = await db.user.findMany({
      where: { email },
      include: { branch: true, account: true },
    })

    if (users.length === 0) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    // Try to find matching user by password
    let matchedUser = null
    for (const u of users) {
      const isValid = await bcrypt.compare(password, u.password)
      if (isValid) {
        matchedUser = u
        break
      }
    }

    if (!matchedUser) {
      return NextResponse.json(
        { error: 'Email atau password salah' },
        { status: 401 }
      )
    }

    if (!matchedUser.isActive) {
      return NextResponse.json(
        { error: 'Akun tidak aktif. Hubungi administrator.' },
        { status: 403 }
      )
    }

    // If user exists in multiple accounts, return account list for selection
    if (users.length > 1 && !matchedUser) {
      const accountList = users.map(u => ({
        accountId: u.accountId,
        accountName: u.account?.name || 'Unknown',
        role: u.role,
      }))
      return NextResponse.json({
        requireAccountSelection: true,
        accounts: accountList,
      })
    }

    // Log activity
    await db.activityLog.create({
      data: {
        userId: matchedUser.id,
        action: 'LOGIN',
        module: 'AUTH',
        details: JSON.stringify({ email: matchedUser.email, accountId: matchedUser.accountId }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        accountId: matchedUser.accountId,
      },
    })

    // Return user data without password
    const { password: _, ...userWithoutPassword } = matchedUser

    return NextResponse.json({
      message: 'Login berhasil',
      user: userWithoutPassword,
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
