import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE /api/reset - Reset all data for a specific accountId (except current user's account)
export async function DELETE(request: NextRequest) {
  try {
    const accountId = request.headers.get('x-account-id')
    if (!accountId) {
      return NextResponse.json({ error: 'Account ID diperlukan' }, { status: 400 })
    }

    // Get the user ID from the request body to preserve that user
    const body = await request.json().catch(() => ({}))
    const preserveUserId = body.preserveUserId as string | undefined

    // Delete in correct order to respect foreign key constraints
    // Only delete data belonging to this accountId
    // 1. Activity logs
    await db.activityLog.deleteMany({ where: { accountId } })

    // 2. Stock adjustments
    await db.stockAdjustment.deleteMany({ where: { accountId } })

    // 3. Transaction items (cascade should handle, but be explicit)
    await db.transactionItem.deleteMany({ where: { transaction: { accountId } } })

    // 4. Transactions
    await db.transaction.deleteMany({ where: { accountId } })

    // 5. Purchase items
    await db.purchaseItem.deleteMany({ where: { purchase: { accountId } } })

    // 6. Purchases
    await db.purchase.deleteMany({ where: { accountId } })

    // 7. Products
    await db.product.deleteMany({ where: { accountId } })

    // 8. Tax settings
    await db.taxSetting.deleteMany({ where: { accountId } })

    // 9. Service charge settings
    await db.serviceChargeSetting.deleteMany({ where: { accountId } })

    // 10. Store settings
    await db.storeSetting.deleteMany({ where: { accountId } })

    // 11. Categories
    await db.category.deleteMany({ where: { accountId } })

    // 14. Payment methods
    await db.paymentMethod.deleteMany({ where: { accountId } })

    // 15. Branches
    await db.branch.deleteMany({ where: { accountId } })

    // 16. Users (except the one performing the reset)
    if (preserveUserId) {
      await db.user.deleteMany({
        where: { accountId, id: { not: preserveUserId } },
      })
      // Reset the preserved user back to owner
      await db.user.update({
        where: { id: preserveUserId },
        data: { role: 'owner', branchId: null },
      })
    } else {
      await db.user.deleteMany({ where: { accountId } })
    }

    return NextResponse.json({
      success: true,
      message: 'Semua data berhasil direset',
    })
  } catch (error) {
    console.error('Reset error:', error)
    return NextResponse.json(
      { error: 'Gagal mereset data. Silakan coba lagi.' },
      { status: 500 }
    )
  }
}
