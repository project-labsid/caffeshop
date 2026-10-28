import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/auth/verify - Validasi sesi yang tersimpan di localStorage.
// Dipanggil saat aplikasi dimuat untuk memastikan sesi masih valid
// (user masih ada di database & akunnya masih aktif).
// Ini mencegah "stale session": sesi lama dari database sebelum reset
// yang membuat semua API mengembalikan 400 "Account ID diperlukan".
export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get('x-user-id')

    if (!userId) {
      return NextResponse.json(
        { error: 'Sesi tidak valid' },
        { status: 401 }
      )
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: { branch: true, account: true },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: 'Sesi tidak valid atau pengguna tidak ditemukan' },
        { status: 401 }
      )
    }

    // Return fresh user data (tanpa password) supaya localStorage
    // diperbarui dengan accountId/role yang benar
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json({ data: userWithoutPassword })
  } catch (error) {
    console.error('Verify session error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
