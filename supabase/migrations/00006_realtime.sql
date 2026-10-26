-- ============================================================
-- Kasir Kopi Shop - Supabase Realtime Configuration
-- Enables real-time subscriptions for live data updates
-- ============================================================
-- These configurations allow the frontend to subscribe
-- to database changes via Supabase Realtime (WebSocket).
--
-- Usage in frontend:
--   supabase.channel('transactions')
--     .on('postgres_changes', {
--       event: 'INSERT',
--       schema: 'public',
--       table: 'transaction'
--     }, payload => { ... })
--     .subscribe()
-- ============================================================

-- Enable Realtime for key tables
-- Note: In Supabase Dashboard, you can also enable this
-- under Database > Replication

ALTER PUBLICATION supabase_realtime ADD TABLE transaction;
ALTER PUBLICATION supabase_realtime ADD TABLE transaction_item;
ALTER PUBLICATION supabase_realtime ADD TABLE product;
ALTER PUBLICATION supabase_realtime ADD TABLE purchase;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_adjustment;
ALTER PUBLICATION supabase_realtime ADD TABLE store_setting;
ALTER PUBLICATION supabase_realtime ADD TABLE payment_method;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_log;

-- ============================================================
-- Realtime RLS policies
-- Supabase Realtime respects RLS. Users will only receive
-- events for rows they can SELECT.
--
-- The tenant_select_* policies we already created will
-- automatically filter realtime events per account.
-- ============================================================

-- ============================================================
-- Presence channel for POS
-- Optional: Track which cashiers are online
-- This is handled client-side, no SQL needed.
-- ============================================================
