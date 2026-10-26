-- ============================================================
-- Kasir Kopi Shop - Supabase PostgreSQL Migration
-- Initial Schema - All Tables
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- HELPER: updated_at trigger function
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. ACCOUNT (Multi-Tenancy Root)
-- ============================================================
CREATE TABLE account (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_account_updated BEFORE UPDATE ON account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 2. BRANCH
-- ============================================================
CREATE TABLE branch (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  address    TEXT,
  phone      TEXT,
  email      TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_branch_updated BEFORE UPDATE ON branch
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 3. USER & AUTH
-- ============================================================
CREATE TABLE "user" (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  password   TEXT NOT NULL,
  phone      TEXT,
  avatar     TEXT,
  role       TEXT NOT NULL DEFAULT 'cashier',
  branch_id  UUID REFERENCES branch(id) ON DELETE SET NULL,
  account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  is_active  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(email, account_id)
);

CREATE TRIGGER trg_user_updated BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. CATEGORY
-- ============================================================
CREATE TABLE category (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  is_active   BOOLEAN NOT NULL DEFAULT true,
  account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_category_updated BEFORE UPDATE ON category
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 5. PRODUCT
-- ============================================================
CREATE TABLE product (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  category_id  UUID REFERENCES category(id) ON DELETE SET NULL,
  cost_price   DOUBLE PRECISION NOT NULL DEFAULT 0,
  sell_price   DOUBLE PRECISION NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  min_stock    INTEGER NOT NULL DEFAULT 5,
  image        TEXT,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  branch_id    UUID REFERENCES branch(id) ON DELETE SET NULL,
  account_id   UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_product_updated BEFORE UPDATE ON product
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. TRANSACTION
-- ============================================================
CREATE TABLE transaction (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number  TEXT NOT NULL UNIQUE,
  user_id         UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  customer_name   TEXT,
  branch_id       UUID REFERENCES branch(id) ON DELETE SET NULL,
  type            TEXT NOT NULL DEFAULT 'sale',
  status          TEXT NOT NULL DEFAULT 'completed',
  subtotal        DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount_amount DOUBLE PRECISION NOT NULL DEFAULT 0,
  tax_amount      DOUBLE PRECISION NOT NULL DEFAULT 0,
  service_charge  DOUBLE PRECISION NOT NULL DEFAULT 0,
  grand_total     DOUBLE PRECISION NOT NULL DEFAULT 0,
  paid_amount     DOUBLE PRECISION NOT NULL DEFAULT 0,
  change_amount   DOUBLE PRECISION NOT NULL DEFAULT 0,
  payment_method  TEXT NOT NULL DEFAULT 'cash',
  payment_details TEXT,
  notes           TEXT,
  account_id      UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  held_at         TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_transaction_updated BEFORE UPDATE ON transaction
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 7. TRANSACTION ITEM
-- ============================================================
CREATE TABLE transaction_item (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES transaction(id) ON DELETE CASCADE,
  product_id     UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  product_name   TEXT NOT NULL,
  quantity       INTEGER NOT NULL,
  price          DOUBLE PRECISION NOT NULL,
  cost_price     DOUBLE PRECISION NOT NULL DEFAULT 0,
  discount       DOUBLE PRECISION NOT NULL DEFAULT 0,
  total          DOUBLE PRECISION NOT NULL,
  notes          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. PURCHASE
-- ============================================================
CREATE TABLE purchase (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  user_id        UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  branch_id      UUID REFERENCES branch(id) ON DELETE SET NULL,
  total_amount   DOUBLE PRECISION NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'received',
  notes          TEXT,
  account_id     UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_purchase_updated BEFORE UPDATE ON purchase
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 9. PURCHASE ITEM
-- ============================================================
CREATE TABLE purchase_item (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID NOT NULL REFERENCES purchase(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  quantity    INTEGER NOT NULL,
  cost_price  DOUBLE PRECISION NOT NULL,
  total       DOUBLE PRECISION NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. STOCK ADJUSTMENT
-- ============================================================
CREATE TABLE stock_adjustment (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id     UUID NOT NULL REFERENCES product(id) ON DELETE RESTRICT,
  user_id        UUID NOT NULL REFERENCES "user"(id) ON DELETE RESTRICT,
  branch_id      UUID REFERENCES branch(id) ON DELETE SET NULL,
  type           TEXT NOT NULL,
  quantity       INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock      INTEGER NOT NULL,
  reason         TEXT,
  account_id     UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. STORE SETTINGS
-- ============================================================
CREATE TABLE store_setting (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT NOT NULL,
  value       TEXT NOT NULL,
  description TEXT,
  account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(key, account_id)
);

CREATE TRIGGER trg_store_setting_updated BEFORE UPDATE ON store_setting
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 12. TAX SETTING
-- ============================================================
CREATE TABLE tax_setting (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled   BOOLEAN NOT NULL DEFAULT false,
  percentage   DOUBLE PRECISION NOT NULL DEFAULT 11,
  mode         TEXT NOT NULL DEFAULT 'exclude',
  apply_to_all BOOLEAN NOT NULL DEFAULT true,
  category_id  UUID REFERENCES category(id) ON DELETE SET NULL,
  account_id   UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_tax_setting_updated BEFORE UPDATE ON tax_setting
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 13. SERVICE CHARGE SETTING
-- ============================================================
CREATE TABLE service_charge_setting (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled  BOOLEAN NOT NULL DEFAULT false,
  percentage  DOUBLE PRECISION NOT NULL DEFAULT 5,
  account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_service_charge_setting_updated BEFORE UPDATE ON service_charge_setting
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 14. ACTIVITY LOG
-- ============================================================
CREATE TABLE activity_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES "user"(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  module     TEXT NOT NULL,
  details    TEXT,
  ip_address TEXT,
  account_id UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 15. SUBSCRIPTION PLAN
-- ============================================================
CREATE TABLE subscription_plan (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name             TEXT NOT NULL,
  price            DOUBLE PRECISION NOT NULL DEFAULT 0,
  period           TEXT NOT NULL DEFAULT 'monthly',
  max_products     INTEGER NOT NULL DEFAULT 200,
  max_branches     INTEGER NOT NULL DEFAULT 1,
  max_users        INTEGER NOT NULL DEFAULT 2,
  max_storage      INTEGER NOT NULL DEFAULT 500,
  ai_chat_daily    INTEGER NOT NULL DEFAULT 10,
  ai_chat_monthly  INTEGER NOT NULL DEFAULT 300,
  features         TEXT NOT NULL,
  is_active        BOOLEAN NOT NULL DEFAULT true,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  account_id       UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_subscription_plan_updated BEFORE UPDATE ON subscription_plan
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 16. SUBSCRIPTION
-- ============================================================
CREATE TABLE subscription (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  plan_id     UUID NOT NULL REFERENCES subscription_plan(id) ON DELETE RESTRICT,
  status      TEXT NOT NULL DEFAULT 'active',
  start_date  TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date    TIMESTAMPTZ,
  account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_subscription_updated BEFORE UPDATE ON subscription
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 17. SUBSCRIPTION USAGE
-- ============================================================
CREATE TABLE subscription_usage (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES subscription(id) ON DELETE CASCADE,
  metric          TEXT NOT NULL,
  current_value   INTEGER NOT NULL DEFAULT 0,
  max_value       INTEGER NOT NULL DEFAULT 0,
  reset_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_subscription_usage_updated BEFORE UPDATE ON subscription_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 18. PAYMENT METHOD
-- ============================================================
CREATE TABLE payment_method (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'active',
  is_default      BOOLEAN NOT NULL DEFAULT false,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  icon            TEXT,
  logo            TEXT,
  bank_name       TEXT,
  account_number  TEXT,
  account_holder  TEXT,
  branch         TEXT,
  swift_code      TEXT,
  phone           TEXT,
  provider        TEXT,
  merchant_id     TEXT,
  merchant_name   TEXT,
  qr_image        TEXT,
  instructions    TEXT,
  payment_gateway TEXT,
  card_provider   TEXT,
  account_id      UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at      TIMESTAMPTZ
);

CREATE TRIGGER trg_payment_method_updated BEFORE UPDATE ON payment_method
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 19. AI USAGE
-- ============================================================
CREATE TABLE ai_usage (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type        TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model_used  TEXT,
  provider    TEXT,
  cost        DOUBLE PRECISION NOT NULL DEFAULT 0,
  account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 20. AI CHAT LOG
-- ============================================================
CREATE TABLE ai_chat_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  role        TEXT NOT NULL,
  content     TEXT NOT NULL,
  tokens_used INTEGER NOT NULL DEFAULT 0,
  model_used  TEXT,
  account_id  UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 21. AI PROVIDER CONFIG (Super Admin)
-- ============================================================
CREATE TABLE ai_provider_config (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider       TEXT NOT NULL,
  api_key        TEXT NOT NULL,
  model_default  TEXT NOT NULL,
  model_fallback TEXT,
  max_tokens     INTEGER NOT NULL DEFAULT 4096,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  account_id     UUID NOT NULL REFERENCES account(id) ON DELETE CASCADE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_ai_provider_config_updated BEFORE UPDATE ON ai_provider_config
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
