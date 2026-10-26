export type UserRole = 'super_admin' | 'owner' | 'admin' | 'cashir';

export interface Account {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  isActive: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  branchId?: string;
  accountId: string;
  isActive: boolean;
  createdAt: string;
  branch?: Branch;
  account?: Account;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  productCount?: number;
}


export interface Product {
  id: string;
  name: string;
  categoryId?: string;
  costPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  image?: string;
  isActive: boolean;
  branchId?: string;
  category?: Category;
  branch?: Branch;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  costPrice: number;
  discount: number;
  total: number;
  notes?: string;
  product?: Product;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  userId: string;
  customerName?: string;
  branchId?: string;
  type: string;
  status: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  grandTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  paymentDetails?: string;
  notes?: string;
  heldAt?: string;
  completedAt?: string;
  createdAt: string;
  user?: User;
  branch?: Branch;
  items?: TransactionItem[];
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  userId: string;
  branchId?: string;
  totalAmount: number;
  status: string;
  notes?: string;
  createdAt: string;
  user?: User;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export interface StockAdjustment {
  id: string;
  productId: string;
  userId: string;
  branchId?: string;
  type: string;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  createdAt: string;
  product?: Product;
  user?: User;
}

export interface TaxSetting {
  id: string;
  isEnabled: boolean;
  percentage: number;
  mode: string;
  applyToAll: boolean;
  categoryId?: string;
}

export interface ServiceChargeSetting {
  id: string;
  isEnabled: boolean;
  percentage: number;
}

export interface StoreSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
}

export interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  monthSales: number;
  monthTransactions: number;
  totalRevenue: number;
  todayExpense: number;
  monthExpense: number;
  totalExpense: number;
  todayPurchaseExpense: number;
  monthPurchaseExpense: number;
  totalPurchaseExpense: number;
  totalProducts: number;
  totalTransactions: number;
  totalBranches: number;
  topProducts: { productId: string; productName: string; quantity: number; revenue: number }[];
  recentTransactions: Transaction[];
  lowStockProducts: Product[];
  salesChartData: { date: string; total: number }[];
  revenueChartData: { date: string; total: number }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export type PageName =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'categories'
  | 'transactions'
  | 'purchases'
  | 'stock'
  | 'reports'
  | 'settings'
  | 'tax-settings'
  | 'branches'
  | 'users'
  | 'accounts';

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
  notes?: string;
}

export interface PaymentSplit {
  method: string;
  amount: number;
}

export interface TaxConfig {
  isEnabled: boolean;
  percentage: number;
  mode: 'include' | 'exclude';
  applyToAll: boolean;
}

export interface ServiceChargeConfig {
  isEnabled: boolean;
  percentage: number;
}
