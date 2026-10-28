import { create } from 'zustand';
import type { User, Account, PageName, CartItem, PaymentSplit, TaxConfig, ServiceChargeConfig } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accountId: string | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setAccountId: (id: string) => void;
}

interface NavigationState {
  currentPage: PageName;
  sidebarOpen: boolean;
  /** null = mode Tambah, string = id produk yang sedang diedit */
  productFormId: string | null;
  setCurrentPage: (page: PageName) => void;
  openProductForm: (productId?: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

interface CartState {
  items: CartItem[];
  customerId: string | null;
  discountTotal: number;
  notes: string;
  isHeld: boolean;
  heldTransactionId: string | null;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateItemDiscount: (productId: string, discount: number) => void;
  updateItemNotes: (productId: string, notes: string) => void;
  setCustomerId: (id: string | null) => void;
  setDiscountTotal: (discount: number) => void;
  setNotes: (notes: string) => void;
  setHeld: (held: boolean, transactionId?: string) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTotalDiscount: () => number;
  getGrandTotal: () => number;
}

interface SettingsState {
  taxConfig: TaxConfig;
  serviceChargeConfig: ServiceChargeConfig;
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeCurrency: string;
  storeLogo: string;
  setTaxConfig: (config: TaxConfig) => void;
  setServiceChargeConfig: (config: ServiceChargeConfig) => void;
  setStoreSettings: (settings: Record<string, string>) => void;
}

// Auth Store
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  accountId: null,
  login: (user) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos_user', JSON.stringify(user));
    }
    // Redirect cashier to POS page on login
    if (user.role === 'cashir') {
      useNavStore.getState().setCurrentPage('pos');
    }
    set({ user, isAuthenticated: true, accountId: user.accountId || null });
  },
  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('pos_user');
    }
    set({ user: null, isAuthenticated: false, accountId: null });
  },
  updateUser: (updates) =>
    set((state) => {
      const newUser = { ...state.user, ...updates } as User;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pos_user', JSON.stringify(newUser));
      }
      return { user: newUser };
    }),
  setAccountId: (id) => set({ accountId: id }),
}));

// Navigation Store
export const useNavStore = create<NavigationState>((set) => ({
  currentPage: 'dashboard',
  sidebarOpen: false,
  productFormId: null,
  setCurrentPage: (page) => set({ currentPage: page, sidebarOpen: false }),
  openProductForm: (productId = null) =>
    set({ currentPage: 'product-form', productFormId: productId, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
}));

// Cart Store
export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  customerId: null,
  discountTotal: 0,
  notes: '',
  isHeld: false,
  heldTransactionId: null,
  addItem: (item) =>
    set((state) => {
      const existing = state.items.find((i) => i.product.id === item.product.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.product.id === item.product.id
              ? { ...i, quantity: i.quantity + item.quantity }
              : i
          ),
        };
      }
      return { items: [...state.items, item] };
    }),
  removeItem: (productId) =>
    set((state) => ({
      items: state.items.filter((i) => i.product.id !== productId),
    })),
  updateQuantity: (productId, quantity) =>
    set((state) => ({
      items:
        quantity <= 0
          ? state.items.filter((i) => i.product.id !== productId)
          : state.items.map((i) =>
              i.product.id === productId ? { ...i, quantity } : i
            ),
    })),
  updateItemDiscount: (productId, discount) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, discount } : i
      ),
    })),
  updateItemNotes: (productId, notes) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.product.id === productId ? { ...i, notes } : i
      ),
    })),
  setCustomerId: (id) => set({ customerId: id }),
  setDiscountTotal: (discount) => set({ discountTotal: discount }),
  setNotes: (notes) => set({ notes }),
  setHeld: (held, transactionId) =>
    set({ isHeld: held, heldTransactionId: transactionId || null }),
  clearCart: () =>
    set({
      items: [],
      customerId: null,
      discountTotal: 0,
      notes: '',
      isHeld: false,
      heldTransactionId: null,
    }),
  getSubtotal: () => {
    const { items } = get();
    return items.reduce(
      (sum, item) => sum + item.product.sellPrice * item.quantity - item.discount,
      0
    );
  },
  getTotalDiscount: () => get().discountTotal,
  getGrandTotal: () => {
    const { items, discountTotal } = get();
    return items.reduce(
      (sum, item) => sum + item.product.sellPrice * item.quantity - item.discount,
      0
    ) - discountTotal;
  },
}));

// Settings Store
export const useSettingsStore = create<SettingsState>((set) => ({
  taxConfig: {
    isEnabled: false,
    percentage: 11,
    mode: 'exclude',
    applyToAll: true,
  },
  serviceChargeConfig: {
    isEnabled: false,
    percentage: 5,
  },
  storeName: 'Kasir Kopi Shop',
  storeAddress: '',
  storePhone: '',
  storeEmail: '',
  storeCurrency: 'Rp',
  storeLogo: '',
  setTaxConfig: (config) => set({ taxConfig: config }),
  setServiceChargeConfig: (config) => set({ serviceChargeConfig: config }),
  setStoreSettings: (settings) =>
    set((state) => ({
      storeName: settings.store_name || state.storeName,
      storeAddress: settings.store_address || state.storeAddress,
      storePhone: settings.store_phone || state.storePhone,
      storeEmail: settings.store_email || state.storeEmail,
      storeCurrency: settings.store_currency || state.storeCurrency,
      storeLogo: settings.store_logo || state.storeLogo,
    })),
}));
