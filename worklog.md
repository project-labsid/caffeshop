---
Task ID: 1
Agent: Main Agent
Task: Create Supabase database code from existing Prisma schema

Work Log:
- Read current prisma/schema.prisma (21 models) and prisma/seed.ts
- Created supabase/migrations/00001_initial_schema.sql - All 21 tables in PostgreSQL with UUID, TIMESTAMPTZ, proper FK ordering, auto-updated_at triggers
- Created supabase/migrations/00002_rls_policies.sql - Full RLS policies for multi-tenant isolation by account_id with role-based access (super_admin, admin, cashier)
- Created supabase/migrations/00003_indexes.sql - Performance indexes including composite, partial, and GIN full-text search indexes
- Created supabase/migrations/00004_functions.sql - Stored procedures: generate_invoice_number, generate_purchase_number, get_dashboard_stats, adjust_stock, reset_account_data + useful views
- Created supabase/migrations/00005_auth_hook.sql - Custom JWT hook to inject account_id and role into claims
- Created supabase/migrations/00006_realtime.sql - Realtime subscriptions for key tables
- Created supabase/seed.sql - Seed data with pre-generated UUIDs, 20 products, 4 users, 5 categories, payment methods, store settings
- Created supabase/prisma-schema-supabase.prisma - Full Prisma schema for PostgreSQL with @map() column name mapping
- Created supabase/supabase-client.ts - Browser and server Supabase client helpers
- Created supabase/config.toml - Supabase CLI configuration
- Created supabase/.env.supabase.example - Environment variable template

Stage Summary:
- Complete Supabase database code created in /home/z/my-project/supabase/
- 6 migration files, 1 seed file, Prisma schema, client helper, config
- All tables use UUID primary keys with gen_random_uuid()
- Full RLS policies enforce multi-tenant data isolation
- Auth hook injects account_id and role into JWT claims
- Helper functions for invoice generation, stock adjustment, dashboard stats
- Ready to deploy to Supabase
