# Task 3-api: API Routes Agent

## Work Record

Created 3 API route files for subscription management, AI usage tracking, and payment method management.

### Files Created:

1. **`/home/z/my-project/src/app/api/subscription/route.ts`** (GET)
   - Seeds 3 default plans (Gratis/Pro/Enterprise) if SubscriptionPlan table is empty
   - Returns all active plans ordered by sortOrder
   - Returns user's active subscription with plan and usage data
   - Auto-creates Gratis subscription if none exists for user
   - Computes real usage metrics (products, branches, users, ai_daily, ai_monthly)
   - Uses WIB (UTC+7) timezone for day/month boundaries

2. **`/home/z/my-project/src/app/api/ai/usage/route.ts`** (GET + POST)
   - GET: Returns AI usage stats (daily count/quota, monthly count/quota, tokens, cost, type breakdown)
   - POST: Logs AI usage with quota check (returns 429 if daily quota exceeded)
   - Updates SubscriptionUsage metrics (ai_daily, ai_monthly) after logging
   - Uses WIB timezone for day/month boundaries
   - Returns plan info with quota details

3. **`/home/z/my-project/src/app/api/payment-methods/route.ts`** (GET + POST + PUT + DELETE)
   - GET: Lists payment methods with filters (type, status, search), soft-delete filter, ordered by default/createdAt
   - POST: Creates payment method with Zod validation, auto-unsets other defaults if isDefault=true
   - PUT: Updates payment method with partial validation, handles default toggle
   - DELETE: Soft-deletes by setting deletedAt timestamp, unsets isDefault

### Patterns Used:
- NextRequest/NextResponse from next/server
- db from @/lib/db (Prisma client)
- Zod for request validation
- try/catch error handling
- JSON response format: { data: ... } or { error: ... }
- Indonesian error messages consistent with project style
- WIB timezone handling (UTC+7) for day/month boundaries

### Lint Results:
- 0 errors, 12 warnings (all pre-existing TanStack Table warnings)
