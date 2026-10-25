import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type RouteParams = { params: Promise<{ barcode: string }> }

// GET /api/products/barcode/[barcode] - Find product by barcode
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    const { barcode } = await params
    const product = await db.product.findFirst({
      where: { barcode, accountId },
      include: { category: true, branch: true },
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Produk tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!product.isActive) {
      return NextResponse.json(
        { error: 'Produk sudah tidak aktif' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: product })
  } catch (error) {
    console.error('Find product by barcode error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan server' },
      { status: 500 }
    )
  }
}
