-- ============================================================
-- Kasir Kopi Shop - Supabase Performance Indexes
-- ============================================================

-- ============================================================
-- ACCOUNT indexes
-- ============================================================
CREATE INDEX idx_account_slug ON account(slug);
CREATE INDEX idx_account_owner_email ON account(owner_email);
CREATE INDEX idx_account_is_active ON account(is_active);

-- ============================================================
-- BRANCH indexes
-- ============================================================
CREATE INDEX idx_branch_account_id ON branch(account_id);
CREATE INDEX idx_branch_is_active ON branch(is_active);

-- ============================================================
-- USER indexes
-- ============================================================
CREATE INDEX idx_user_account_id ON "user"(account_id);
CREATE INDEX idx_user_email_account ON "user"(email, account_id);
CREATE INDEX idx_user_branch_id ON "user"(branch_id);
CREATE INDEX idx_user_role ON "user"(role);
CREATE INDEX idx_user_is_active ON "user"(is_active);

-- ============================================================
-- CATEGORY indexes
-- ============================================================
CREATE INDEX idx_category_account_id ON category(account_id);
CREATE INDEX idx_category_is_active ON category(is_active);

-- ============================================================
-- PRODUCT indexes
-- ============================================================
CREATE INDEX idx_product_account_id ON product(account_id);
CREATE INDEX idx_product_category_id ON product(category_id);
CREATE INDEX idx_product_branch_id ON product(branch_id);
CREATE INDEX idx_product_is_active ON product(is_active);
CREATE INDEX idx_product_name ON product USING gin(to_tsvector('simple', name));
CREATE INDEX idx_product_stock_low ON product(stock, min_stock) WHERE stock <= min_stock;

-- ============================================================
-- TRANSACTION indexes
-- ============================================================
CREATE INDEX idx_transaction_account_id ON transaction(account_id);
CREATE INDEX idx_transaction_user_id ON transaction(user_id);
CREATE INDEX idx_transaction_branch_id ON transaction(branch_id);
CREATE INDEX idx_transaction_invoice_number ON transaction(invoice_number);
CREATE INDEX idx_transaction_status ON transaction(status);
CREATE INDEX idx_transaction_type ON transaction(type);
CREATE INDEX idx_transaction_payment_method ON transaction(payment_method);
CREATE INDEX idx_transaction_created_at ON transaction(created_at);
CREATE INDEX idx_transaction_completed_at ON transaction(completed_at);
CREATE INDEX idx_transaction_account_status ON transaction(account_id, status);
CREATE INDEX idx_transaction_account_date ON transaction(account_id, created_at);

-- ============================================================
-- TRANSACTION ITEM indexes
-- ============================================================
CREATE INDEX idx_transaction_item_transaction_id ON transaction_item(transaction_id);
CREATE INDEX idx_transaction_item_product_id ON transaction_item(product_id);

-- ============================================================
-- PURCHASE indexes
-- ============================================================
CREATE INDEX idx_purchase_account_id ON purchase(account_id);
CREATE INDEX idx_purchase_user_id ON purchase(user_id);
CREATE INDEX idx_purchase_branch_id ON purchase(branch_id);
CREATE INDEX idx_purchase_status ON purchase(status);
CREATE INDEX idx_purchase_created_at ON purchase(created_at);
CREATE INDEX idx_purchase_account_date ON purchase(account_id, created_at);

-- ============================================================
-- PURCHASE ITEM indexes
-- ============================================================
CREATE INDEX idx_purchase_item_purchase_id ON purchase_item(purchase_id);
CREATE INDEX idx_purchase_item_product_id ON purchase_item(product_id);

-- ============================================================
-- STOCK ADJUSTMENT indexes
-- ============================================================
CREATE INDEX idx_stock_adjustment_account_id ON stock_adjustment(account_id);
CREATE INDEX idx_stock_adjustment_product_id ON stock_adjustment(product_id);
CREATE INDEX idx_stock_adjustment_user_id ON stock_adjustment(user_id);
CREATE INDEX idx_stock_adjustment_type ON stock_adjustment(type);
CREATE INDEX idx_stock_adjustment_created_at ON stock_adjustment(created_at);

-- ============================================================
-- STORE SETTING indexes
-- ============================================================
CREATE INDEX idx_store_setting_account_id ON store_setting(account_id);
CREATE INDEX idx_store_setting_key ON store_setting(key);

-- ============================================================
-- TAX SETTING indexes
-- ============================================================
CREATE INDEX idx_tax_setting_account_id ON tax_setting(account_id);

-- ============================================================
-- SERVICE CHARGE SETTING indexes
-- ============================================================
CREATE INDEX idx_service_charge_setting_account_id ON service_charge_setting(account_id);

-- ============================================================
-- ACTIVITY LOG indexes
-- ============================================================
CREATE INDEX idx_activity_log_account_id ON activity_log(account_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_module ON activity_log(module);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);
CREATE INDEX idx_activity_log_account_date ON activity_log(account_id, created_at);

-- ============================================================
-- SUBSCRIPTION PLAN indexes
-- ============================================================
CREATE INDEX idx_subscription_plan_account_id ON subscription_plan(account_id);

-- ============================================================
-- SUBSCRIPTION indexes
-- ============================================================
CREATE INDEX idx_subscription_account_id ON subscription(account_id);
CREATE INDEX idx_subscription_user_id ON subscription(user_id);
CREATE INDEX idx_subscription_plan_id ON subscription(plan_id);
CREATE INDEX idx_subscription_status ON subscription(status);

-- ============================================================
-- SUBSCRIPTION USAGE indexes
-- ============================================================
CREATE INDEX idx_subscription_usage_subscription_id ON subscription_usage(subscription_id);
CREATE INDEX idx_subscription_usage_metric ON subscription_usage(metric);

-- ============================================================
-- PAYMENT METHOD indexes
-- ============================================================
CREATE INDEX idx_payment_method_account_id ON payment_method(account_id);
CREATE INDEX idx_payment_method_type ON payment_method(type);
CREATE INDEX idx_payment_method_status ON payment_method(status);
CREATE INDEX idx_payment_method_deleted_at ON payment_method(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================================
-- AI USAGE indexes
-- ============================================================
CREATE INDEX idx_ai_usage_account_id ON ai_usage(account_id);
CREATE INDEX idx_ai_usage_user_id ON ai_usage(user_id);
CREATE INDEX idx_ai_usage_type ON ai_usage(type);
CREATE INDEX idx_ai_usage_created_at ON ai_usage(created_at);

-- ============================================================
-- AI CHAT LOG indexes
-- ============================================================
CREATE INDEX idx_ai_chat_log_account_id ON ai_chat_log(account_id);
CREATE INDEX idx_ai_chat_log_user_id ON ai_chat_log(user_id);
CREATE INDEX idx_ai_chat_log_created_at ON ai_chat_log(created_at);

-- ============================================================
-- AI PROVIDER CONFIG indexes
-- ============================================================
CREATE INDEX idx_ai_provider_config_account_id ON ai_provider_config(account_id);
CREATE INDEX idx_ai_provider_config_provider ON ai_provider_config(provider);
