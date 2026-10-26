-- ============================================================
-- Kasir Kopi Shop - Supabase Database Functions
-- Useful stored procedures and views
-- ============================================================

-- ============================================================
-- FUNCTION: generate_invoice_number
-- Auto-generates the next invoice number for a given prefix and account
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_number(
  p_prefix TEXT DEFAULT 'INV',
  p_account_id UUID
)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(p_prefix) + 2) AS INTEGER)), 0) + 1
  INTO next_num
  FROM transaction
  WHERE account_id = p_account_id
    AND invoice_number LIKE p_prefix || '-%';

  invoice_num := p_prefix || '-' || LPAD(next_num::TEXT, 6, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: generate_purchase_number
-- Auto-generates the next purchase invoice number
-- ============================================================
CREATE OR REPLACE FUNCTION generate_purchase_number(
  p_prefix TEXT DEFAULT 'PO',
  p_account_id UUID
)
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  invoice_num TEXT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM LENGTH(p_prefix) + 2) AS INTEGER)), 0) + 1
  INTO next_num
  FROM purchase
  WHERE account_id = p_account_id
    AND invoice_number LIKE p_prefix || '-%';

  invoice_num := p_prefix || '-' || LPAD(next_num::TEXT, 5, '0');
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VIEW: dashboard_summary
-- Pre-computed dashboard data for an account
-- ============================================================
CREATE OR REPLACE VIEW dashboard_summary AS
SELECT
  t.account_id,
  DATE(t.created_at) AS tx_date,
  COUNT(*) FILTER (WHERE t.status = 'completed' AND t.type = 'sale') AS total_sales,
  COALESCE(SUM(t.grand_total) FILTER (WHERE t.status = 'completed' AND t.type = 'sale'), 0) AS total_revenue,
  COALESCE(SUM(t.tax_amount) FILTER (WHERE t.status = 'completed' AND t.type = 'sale'), 0) AS total_tax,
  COALESCE(SUM(t.service_charge) FILTER (WHERE t.status = 'completed' AND t.type = 'sale'), 0) AS total_service_charge,
  COALESCE(SUM(t.discount_amount) FILTER (WHERE t.status = 'completed' AND t.type = 'sale'), 0) AS total_discount,
  COUNT(*) FILTER (WHERE t.status = 'cancelled') AS total_cancelled,
  COALESCE(SUM(t.grand_total) FILTER (WHERE t.status = 'cancelled'), 0) AS cancelled_amount
FROM transaction t
GROUP BY t.account_id, DATE(t.created_at);

-- ============================================================
-- VIEW: product_sales_summary
-- Aggregated product sales data
-- ============================================================
CREATE OR REPLACE VIEW product_sales_summary AS
SELECT
  p.id AS product_id,
  p.name AS product_name,
  p.account_id,
  p.category_id,
  p.sell_price,
  p.cost_price,
  p.stock,
  p.min_stock,
  COALESCE(SUM(ti.quantity), 0) AS total_qty_sold,
  COALESCE(SUM(ti.total), 0) AS total_sales_amount,
  COALESCE(SUM(ti.quantity * ti.cost_price), 0) AS total_cost_amount,
  COALESCE(SUM(ti.total) - SUM(ti.quantity * ti.cost_price), 0) AS total_profit
FROM product p
LEFT JOIN transaction_item ti ON ti.product_id = p.id
LEFT JOIN transaction t ON t.id = ti.transaction_id AND t.status = 'completed' AND t.type = 'sale'
GROUP BY p.id, p.name, p.account_id, p.category_id, p.sell_price, p.cost_price, p.stock, p.min_stock;

-- ============================================================
-- VIEW: daily_expenses
-- Purchase expenses grouped by day and account
-- ============================================================
CREATE OR REPLACE VIEW daily_expenses AS
SELECT
  pu.account_id,
  DATE(pu.created_at) AS expense_date,
  COUNT(*) AS total_purchases,
  COALESCE(SUM(pu.total_amount), 0) AS total_expense
FROM purchase pu
WHERE pu.status = 'received'
GROUP BY pu.account_id, DATE(pu.created_at);

-- ============================================================
-- FUNCTION: get_dashboard_stats
-- Returns dashboard statistics for an account within a date range
-- ============================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats(
  p_account_id UUID,
  p_start_date TIMESTAMPTZ DEFAULT NULL,
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
  total_revenue DOUBLE PRECISION,
  total_expense DOUBLE PRECISION,
  total_transactions BIGINT,
  total_products INTEGER,
  low_stock_count BIGINT,
  total_profit DOUBLE PRECISION
) AS $$
DECLARE
  v_start TIMESTAMPTZ := COALESCE(p_start_date, date_trunc('month', now()));
  v_end TIMESTAMPTZ := COALESCE(p_end_date, now());
BEGIN
  RETURN QUERY
  SELECT
    -- Total Revenue (completed sales)
    COALESCE(SUM(t.grand_total), 0)::DOUBLE PRECISION,
    -- Total Expense (received purchases)
    (SELECT COALESCE(SUM(pu.total_amount), 0)::DOUBLE PRECISION
     FROM purchase pu
     WHERE pu.account_id = p_account_id
       AND pu.status = 'received'
       AND pu.created_at >= v_start
       AND pu.created_at <= v_end),
    -- Total Transactions
    COUNT(*)::BIGINT,
    -- Total Products
    (SELECT COUNT(*)::INTEGER
     FROM product pr
     WHERE pr.account_id = p_account_id
       AND pr.is_active = true),
    -- Low Stock Count
    (SELECT COUNT(*)::BIGINT
     FROM product pr
     WHERE pr.account_id = p_account_id
       AND pr.is_active = true
       AND pr.stock <= pr.min_stock),
    -- Total Profit (revenue - cost of goods)
    COALESCE(SUM(t.grand_total) - SUM(
      COALESCE((SELECT SUM(ti2.quantity * ti2.cost_price)
       FROM transaction_item ti2 WHERE ti2.transaction_id = t.id), 0)
    ), 0)::DOUBLE PRECISION
  FROM transaction t
  WHERE t.account_id = p_account_id
    AND t.status = 'completed'
    AND t.type = 'sale'
    AND t.created_at >= v_start
    AND t.created_at <= v_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: adjust_stock
-- Adjusts product stock and creates a stock_adjustment record
-- ============================================================
CREATE OR REPLACE FUNCTION adjust_stock(
  p_product_id UUID,
  p_user_id UUID,
  p_account_id UUID,
  p_type TEXT,
  p_quantity INTEGER,
  p_reason TEXT DEFAULT NULL,
  p_branch_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_previous_stock INTEGER;
  v_new_stock INTEGER;
  v_adjustment_id UUID;
BEGIN
  -- Get current stock
  SELECT stock INTO v_previous_stock FROM product WHERE id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not found';
  END IF;

  -- Calculate new stock
  CASE p_type
    WHEN 'in' THEN v_new_stock := v_previous_stock + p_quantity;
    WHEN 'out' THEN v_new_stock := GREATEST(0, v_previous_stock - p_quantity);
    WHEN 'adjustment', 'opname' THEN v_new_stock := p_quantity; -- absolute value for opname
    ELSE RAISE EXCEPTION 'Invalid adjustment type: %', p_type;
  END CASE;

  -- Update product stock
  UPDATE product SET stock = v_new_stock WHERE id = p_product_id;

  -- Create adjustment record
  INSERT INTO stock_adjustment (product_id, user_id, branch_id, type, quantity, previous_stock, new_stock, reason, account_id)
  VALUES (p_product_id, p_user_id, p_branch_id, p_type, ABS(p_quantity), v_previous_stock, v_new_stock, p_reason, p_account_id)
  RETURNING id INTO v_adjustment_id;

  RETURN v_adjustment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: reset_account_data
-- Deletes all data for an account (except users and account itself)
-- Only accessible by super_admin or account owner
-- ============================================================
CREATE OR REPLACE FUNCTION reset_account_data(
  p_account_id UUID
)
RETURNS VOID AS $$
BEGIN
  -- Delete in correct order (respecting foreign keys)
  DELETE FROM transaction_item WHERE transaction_id IN (
    SELECT id FROM transaction WHERE account_id = p_account_id
  );
  DELETE FROM transaction WHERE account_id = p_account_id;

  DELETE FROM purchase_item WHERE purchase_id IN (
    SELECT id FROM purchase WHERE account_id = p_account_id
  );
  DELETE FROM purchase WHERE account_id = p_account_id;

  DELETE FROM stock_adjustment WHERE account_id = p_account_id;
  DELETE FROM activity_log WHERE account_id = p_account_id;
  DELETE FROM store_setting WHERE account_id = p_account_id;
  DELETE FROM tax_setting WHERE account_id = p_account_id;
  DELETE FROM service_charge_setting WHERE account_id = p_account_id;
  DELETE FROM payment_method WHERE account_id = p_account_id;
  DELETE FROM product WHERE account_id = p_account_id;
  DELETE FROM category WHERE account_id = p_account_id;
  DELETE FROM branch WHERE account_id = p_account_id;
  DELETE FROM subscription_usage WHERE subscription_id IN (
    SELECT id FROM subscription WHERE account_id = p_account_id
  );
  DELETE FROM subscription WHERE account_id = p_account_id;
  DELETE FROM subscription_plan WHERE account_id = p_account_id;
  DELETE FROM ai_usage WHERE account_id = p_account_id;
  DELETE FROM ai_chat_log WHERE account_id = p_account_id;
  DELETE FROM ai_provider_config WHERE account_id = p_account_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
