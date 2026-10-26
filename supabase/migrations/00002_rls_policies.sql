-- ============================================================
-- Kasir Kopi Shop - Supabase RLS (Row Level Security) Policies
-- Multi-tenant isolation by account_id
-- ============================================================

-- ============================================================
-- STRATEGY:
-- Each table with account_id gets RLS enabled.
-- Policies:
--   1. "tenant_select"   - Users can SELECT rows in their own account
--   2. "tenant_insert"   - Users can INSERT rows with their own account_id
--   3. "tenant_update"   - Users can UPDATE rows in their own account
--   4. "tenant_delete"   - Only admin/super_admin can DELETE rows in their account
--
-- We use a custom claim "account_id" set in the JWT token
-- via Supabase Auth metadata or a custom hook.
-- ============================================================

-- ============================================================
-- Helper: Get current user's account_id from JWT claims
-- ============================================================
-- In Supabase, you can set custom claims via auth.jwt()
-- or via a custom function that reads from the user table.
-- Here we create a helper function:

CREATE OR REPLACE FUNCTION auth.account_id()
RETURNS UUID AS $$
  -- Option 1: Read from JWT custom claims (if set via Supabase Auth hook)
  -- SELECT (auth.jwt() -> 'app_metadata' ->> 'account_id')::UUID;

  -- Option 2: Read from user table using auth.uid()
  SELECT u.account_id FROM "user" u WHERE u.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- Helper: Get current user's role from JWT claims
-- ============================================================
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  -- Option 1: Read from JWT custom claims
  -- SELECT (auth.jwt() -> 'app_metadata' ->> 'role')::TEXT;

  -- Option 2: Read from user table
  SELECT u.role FROM "user" u WHERE u.id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- ACCOUNT table RLS
-- ============================================================
ALTER TABLE account ENABLE ROW LEVEL SECURITY;

-- Everyone can read their own account
CREATE POLICY "tenant_select_account" ON account
  FOR SELECT USING (id = auth.account_id());

-- Only admin/super_admin can update account
CREATE POLICY "tenant_update_account" ON account
  FOR UPDATE USING (
    id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- BRANCH table RLS
-- ============================================================
ALTER TABLE branch ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_branch" ON branch
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_branch" ON branch
  FOR INSERT WITH CHECK (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "tenant_update_branch" ON branch
  FOR UPDATE USING (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "tenant_delete_branch" ON branch
  FOR DELETE USING (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- USER table RLS
-- ============================================================
ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_user" ON "user"
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_user" ON "user"
  FOR INSERT WITH CHECK (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "tenant_update_user" ON "user"
  FOR UPDATE USING (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

CREATE POLICY "tenant_delete_user" ON "user"
  FOR DELETE USING (
    account_id = auth.account_id()
    AND auth.user_role() = 'super_admin'
  );

-- ============================================================
-- CATEGORY table RLS
-- ============================================================
ALTER TABLE category ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_category" ON category
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_category" ON category
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_category" ON category
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_category" ON category
  FOR DELETE USING (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- PRODUCT table RLS
-- ============================================================
ALTER TABLE product ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_product" ON product
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_product" ON product
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_product" ON product
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_product" ON product
  FOR DELETE USING (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- TRANSACTION table RLS
-- ============================================================
ALTER TABLE transaction ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_transaction" ON transaction
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_transaction" ON transaction
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_transaction" ON transaction
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_transaction" ON transaction
  FOR DELETE USING (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- TRANSACTION ITEM table RLS
-- ============================================================
ALTER TABLE transaction_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_transaction_item" ON transaction_item
  FOR SELECT USING (
    transaction_id IN (
      SELECT id FROM transaction WHERE account_id = auth.account_id()
    )
  );

CREATE POLICY "tenant_insert_transaction_item" ON transaction_item
  FOR INSERT WITH CHECK (
    transaction_id IN (
      SELECT id FROM transaction WHERE account_id = auth.account_id()
    )
  );

CREATE POLICY "tenant_update_transaction_item" ON transaction_item
  FOR UPDATE USING (
    transaction_id IN (
      SELECT id FROM transaction WHERE account_id = auth.account_id()
    )
  );

CREATE POLICY "tenant_delete_transaction_item" ON transaction_item
  FOR DELETE USING (
    transaction_id IN (
      SELECT id FROM transaction WHERE account_id = auth.account_id()
    )
  );

-- ============================================================
-- PURCHASE table RLS
-- ============================================================
ALTER TABLE purchase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_purchase" ON purchase
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_purchase" ON purchase
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_purchase" ON purchase
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_purchase" ON purchase
  FOR DELETE USING (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- PURCHASE ITEM table RLS
-- ============================================================
ALTER TABLE purchase_item ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_purchase_item" ON purchase_item
  FOR SELECT USING (
    purchase_id IN (
      SELECT id FROM purchase WHERE account_id = auth.account_id()
    )
  );

CREATE POLICY "tenant_insert_purchase_item" ON purchase_item
  FOR INSERT WITH CHECK (
    purchase_id IN (
      SELECT id FROM purchase WHERE account_id = auth.account_id()
    )
  );

CREATE POLICY "tenant_update_purchase_item" ON purchase_item
  FOR UPDATE USING (
    purchase_id IN (
      SELECT id FROM purchase WHERE account_id = auth.account_id()
    )
  );

CREATE POLICY "tenant_delete_purchase_item" ON purchase_item
  FOR DELETE USING (
    purchase_id IN (
      SELECT id FROM purchase WHERE account_id = auth.account_id()
    )
  );

-- ============================================================
-- STOCK ADJUSTMENT table RLS
-- ============================================================
ALTER TABLE stock_adjustment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_stock_adjustment" ON stock_adjustment
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_stock_adjustment" ON stock_adjustment
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_stock_adjustment" ON stock_adjustment
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_stock_adjustment" ON stock_adjustment
  FOR DELETE USING (
    account_id = auth.account_id()
    AND auth.user_role() IN ('super_admin', 'admin')
  );

-- ============================================================
-- STORE SETTING table RLS
-- ============================================================
ALTER TABLE store_setting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_store_setting" ON store_setting
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_store_setting" ON store_setting
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_store_setting" ON store_setting
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_store_setting" ON store_setting
  FOR DELETE USING (account_id = auth.account_id());

-- ============================================================
-- TAX SETTING table RLS
-- ============================================================
ALTER TABLE tax_setting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_tax_setting" ON tax_setting
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_tax_setting" ON tax_setting
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_tax_setting" ON tax_setting
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_tax_setting" ON tax_setting
  FOR DELETE USING (account_id = auth.account_id());

-- ============================================================
-- SERVICE CHARGE SETTING table RLS
-- ============================================================
ALTER TABLE service_charge_setting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_service_charge_setting" ON service_charge_setting
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_service_charge_setting" ON service_charge_setting
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_service_charge_setting" ON service_charge_setting
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_service_charge_setting" ON service_charge_setting
  FOR DELETE USING (account_id = auth.account_id());

-- ============================================================
-- ACTIVITY LOG table RLS
-- ============================================================
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_activity_log" ON activity_log
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_activity_log" ON activity_log
  FOR INSERT WITH CHECK (account_id = auth.account_id());

-- ============================================================
-- SUBSCRIPTION PLAN table RLS
-- ============================================================
ALTER TABLE subscription_plan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_subscription_plan" ON subscription_plan
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_subscription_plan" ON subscription_plan
  FOR INSERT WITH CHECK (
    account_id = auth.account_id()
    AND auth.user_role() = 'super_admin'
  );

CREATE POLICY "tenant_update_subscription_plan" ON subscription_plan
  FOR UPDATE USING (
    account_id = auth.account_id()
    AND auth.user_role() = 'super_admin'
  );

-- ============================================================
-- SUBSCRIPTION table RLS
-- ============================================================
ALTER TABLE subscription ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_subscription" ON subscription
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_subscription" ON subscription
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_subscription" ON subscription
  FOR UPDATE USING (account_id = auth.account_id());

-- ============================================================
-- SUBSCRIPTION USAGE table RLS
-- ============================================================
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_subscription_usage" ON subscription_usage
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM subscription WHERE account_id = auth.account_id()
    )
  );

CREATE POLICY "tenant_insert_subscription_usage" ON subscription_usage
  FOR INSERT WITH CHECK (
    subscription_id IN (
      SELECT id FROM subscription WHERE account_id = auth.account_id()
    )
  );

CREATE POLICY "tenant_update_subscription_usage" ON subscription_usage
  FOR UPDATE USING (
    subscription_id IN (
      SELECT id FROM subscription WHERE account_id = auth.account_id()
    )
  );

-- ============================================================
-- PAYMENT METHOD table RLS
-- ============================================================
ALTER TABLE payment_method ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_payment_method" ON payment_method
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_payment_method" ON payment_method
  FOR INSERT WITH CHECK (account_id = auth.account_id());

CREATE POLICY "tenant_update_payment_method" ON payment_method
  FOR UPDATE USING (account_id = auth.account_id());

CREATE POLICY "tenant_delete_payment_method" ON payment_method
  FOR DELETE USING (account_id = auth.account_id());

-- ============================================================
-- AI USAGE table RLS
-- ============================================================
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_ai_usage" ON ai_usage
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_ai_usage" ON ai_usage
  FOR INSERT WITH CHECK (account_id = auth.account_id());

-- ============================================================
-- AI CHAT LOG table RLS
-- ============================================================
ALTER TABLE ai_chat_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_ai_chat_log" ON ai_chat_log
  FOR SELECT USING (account_id = auth.account_id());

CREATE POLICY "tenant_insert_ai_chat_log" ON ai_chat_log
  FOR INSERT WITH CHECK (account_id = auth.account_id());

-- ============================================================
-- AI PROVIDER CONFIG table RLS
-- ============================================================
ALTER TABLE ai_provider_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_select_ai_provider_config" ON ai_provider_config
  FOR SELECT USING (
    account_id = auth.account_id()
    AND auth.user_role() = 'super_admin'
  );

CREATE POLICY "tenant_insert_ai_provider_config" ON ai_provider_config
  FOR INSERT WITH CHECK (
    account_id = auth.account_id()
    AND auth.user_role() = 'super_admin'
  );

CREATE POLICY "tenant_update_ai_provider_config" ON ai_provider_config
  FOR UPDATE USING (
    account_id = auth.account_id()
    AND auth.user_role() = 'super_admin'
  );
