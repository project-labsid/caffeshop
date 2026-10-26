---
Task ID: 1
Agent: main
Task: Fix app not viewable, fix product add error, align dashboard/reports, restrict reset data

Work Log:
- Restarted dev server (was not running, needed cache clear)
- Investigated product add "Terjadi kesalahan server" — was a stale cache issue, API works fine with valid accountId
- Fixed dashboard expense calculation: changed from `_sum: { costPrice: true }` (wrong — sums per-unit cost) to `findMany` + `costPrice * quantity` (correct — same as reports)
- Added purchase expenses (COGS + purchases) to dashboard API for total expense
- Added purchase expenses to reports API (profit_loss and daily/weekly/monthly/yearly types)
- Added role check to reset API: only super_admin and owner can reset data (returns 403 for others)
- Updated DashboardStats type to include all new fields
- Updated ReportsPage to use `totalExpense` instead of `costOfGoodsSold` for pengeluaran display
- Fixed hardcoded "Cabang: 2" in dashboard — now uses actual branch count from API
- Added "Laba Kotor" stat card to dashboard
- Verified all changes with agent browser — all working correctly

Stage Summary:
- Dashboard and reports now show same income/expense figures (COGS = costPrice * quantity + purchase expenses)
- Reset data restricted to super_admin and owner roles (both UI filter and API check)
- Product creation working correctly
- Dashboard now shows dynamic branch count instead of hardcoded value
- All API endpoints returning consistent data
