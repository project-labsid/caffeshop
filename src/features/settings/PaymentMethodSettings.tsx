'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Pencil,
  Star,
  Power,
  Trash2,
  Copy,
  CreditCard,
  Banknote,
  QrCode,
  Smartphone,
  Building2,
  Landmark,
  Wallet,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

// ─── Types ───────────────────────────────────────────────────────────────────

type PaymentType =
  | 'tunai'
  | 'qris'
  | 'transfer_bank'
  | 'virtual_account'
  | 'ewallet'
  | 'kartu_debit'
  | 'kartu_kredit'
  | 'manual'
  | 'lainnya';

interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentType;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  order: number;
  // Transfer fields
  bankName?: string;
  accountNumber?: string;
  accountHolder?: string;
  branch?: string;
  swiftCode?: string;
  transferInstructions?: string;
  logoUrl?: string;
  // QRIS fields
  qrImageUrl?: string;
  merchantName?: string;
  merchantId?: string;
  qrisInstructions?: string;
  // E-Wallet fields
  ewalletProvider?: string;
  ewalletPhone?: string;
  ewalletQrUrl?: string;
  ewalletInstructions?: string;
  // Virtual Account fields
  vaProvider?: string;
  vaNumber?: string;
  vaCompanyName?: string;
  vaInstructions?: string;
  // Debit/Credit fields
  cardProvider?: string;
  paymentGateway?: string;
  // Manual/Other fields
  manualInstructions?: string;
}

interface FormData {
  name: string;
  type: PaymentType;
  description: string;
  isActive: boolean;
  isDefault: boolean;
  order: number;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branch: string;
  swiftCode: string;
  transferInstructions: string;
  qrImageUrl: string;
  merchantName: string;
  merchantId: string;
  qrisInstructions: string;
  ewalletProvider: string;
  ewalletPhone: string;
  ewalletQrUrl: string;
  ewalletInstructions: string;
  vaProvider: string;
  vaNumber: string;
  vaCompanyName: string;
  vaInstructions: string;
  cardProvider: string;
  paymentGateway: string;
  manualInstructions: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: PaymentType; label: string }[] = [
  { value: 'tunai', label: 'Tunai' },
  { value: 'qris', label: 'QRIS' },
  { value: 'transfer_bank', label: 'Transfer Bank' },
  { value: 'virtual_account', label: 'Virtual Account' },
  { value: 'ewallet', label: 'E-Wallet' },
  { value: 'kartu_debit', label: 'Kartu Debit' },
  { value: 'kartu_kredit', label: 'Kartu Kredit' },
  { value: 'manual', label: 'Manual' },
  { value: 'lainnya', label: 'Lainnya' },
];

const TYPE_LABELS: Record<PaymentType, string> = {
  tunai: 'Tunai',
  qris: 'QRIS',
  transfer_bank: 'Transfer Bank',
  virtual_account: 'Virtual Account',
  ewallet: 'E-Wallet',
  kartu_debit: 'Kartu Debit',
  kartu_kredit: 'Kartu Kredit',
  manual: 'Manual',
  lainnya: 'Lainnya',
};

const TYPE_BADGE_COLORS: Record<PaymentType, string> = {
  tunai: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  qris: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
  transfer_bank: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  virtual_account: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400',
  ewallet: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  kartu_debit: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  kartu_kredit: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  manual: 'bg-gray-100 text-gray-700 dark:bg-gray-800/50 dark:text-gray-400',
  lainnya: 'bg-stone-100 text-stone-700 dark:bg-stone-800/50 dark:text-stone-400',
};

const TYPE_ICON_COLORS: Record<PaymentType, string> = {
  tunai: 'bg-emerald-500',
  qris: 'bg-violet-500',
  transfer_bank: 'bg-blue-500',
  virtual_account: 'bg-sky-500',
  ewallet: 'bg-amber-500',
  kartu_debit: 'bg-orange-500',
  kartu_kredit: 'bg-rose-500',
  manual: 'bg-gray-500',
  lainnya: 'bg-stone-500',
};

const EWALLET_PROVIDERS = ['GoPay', 'OVO', 'DANA', 'ShopeePay', 'LinkAja'];
const CARD_PROVIDERS = ['Visa', 'Mastercard', 'JCB', 'Amex'];
const GATEWAY_PROVIDERS = ['Stripe', 'Midtrans', 'Xendit'];

const INITIAL_FORM: FormData = {
  name: '',
  type: 'tunai',
  description: '',
  isActive: true,
  isDefault: false,
  order: 0,
  bankName: '',
  accountNumber: '',
  accountHolder: '',
  branch: '',
  swiftCode: '',
  transferInstructions: '',
  qrImageUrl: '',
  merchantName: '',
  merchantId: '',
  qrisInstructions: '',
  ewalletProvider: 'GoPay',
  ewalletPhone: '',
  ewalletQrUrl: '',
  ewalletInstructions: '',
  vaProvider: '',
  vaNumber: '',
  vaCompanyName: '',
  vaInstructions: '',
  cardProvider: 'Visa',
  paymentGateway: 'Midtrans',
  manualInstructions: '',
};

const MOCK_METHODS: PaymentMethod[] = [
  {
    id: '1',
    name: 'Tunai',
    type: 'tunai',
    description: 'Pembayaran tunai langsung di kasir',
    isActive: true,
    isDefault: true,
    order: 1,
  },
  {
    id: '2',
    name: 'QRIS',
    type: 'qris',
    description: 'Pembayaran via scan QRIS dari aplikasi apapun',
    isActive: true,
    isDefault: false,
    order: 2,
    merchantName: 'Toko Sejahtera',
    merchantId: 'QR-MERCHANT-001',
    qrisInstructions: 'Scan kode QR menggunakan aplikasi e-wallet atau mobile banking Anda. Pastikan jumlah yang ditransfer sesuai dengan total pembayaran.',
  },
  {
    id: '3',
    name: 'Transfer BCA',
    type: 'transfer_bank',
    description: 'Transfer melalui rekening BCA',
    isActive: true,
    isDefault: false,
    order: 3,
    bankName: 'BCA',
    accountNumber: '123-456-7890',
    accountHolder: 'PT Toko Sejahtera',
    branch: 'KCP Kelapa Gading',
    swiftCode: 'CENAIDJA',
    transferInstructions: 'Transfer ke rekening BCA atas nama PT Toko Sejahtera. Konfirmasi pembayaran melalui struk transfer atau bukti transfer.',
  },
  {
    id: '4',
    name: 'E-Wallet GoPay',
    type: 'ewallet',
    description: 'Pembayaran menggunakan GoPay',
    isActive: true,
    isDefault: false,
    order: 4,
    ewalletProvider: 'GoPay',
    ewalletPhone: '0812-3456-7890',
    ewalletInstructions: 'Pilih GoPay di aplikasi Gojek, scan QR code atau masukkan nomor tujuan, lalu konfirmasi pembayaran.',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTypeIcon(type: PaymentType) {
  switch (type) {
    case 'tunai': return Banknote;
    case 'qris': return QrCode;
    case 'transfer_bank': return Landmark;
    case 'virtual_account': return Building2;
    case 'ewallet': return Smartphone;
    case 'kartu_debit': return CreditCard;
    case 'kartu_kredit': return CreditCard;
    case 'manual': return Wallet;
    case 'lainnya': return CreditCard;
  }
}

function getMethodDetails(method: PaymentMethod): string[] {
  const details: string[] = [];
  switch (method.type) {
    case 'transfer_bank':
      if (method.bankName) details.push(`Bank: ${method.bankName}`);
      if (method.accountNumber) details.push(`No. Rekening: ${method.accountNumber}`);
      if (method.accountHolder) details.push(`Atas Nama: ${method.accountHolder}`);
      if (method.branch) details.push(`Cabang: ${method.branch}`);
      break;
    case 'qris':
      if (method.merchantName) details.push(`Merchant: ${method.merchantName}`);
      if (method.merchantId) details.push(`Merchant ID: ${method.merchantId}`);
      break;
    case 'ewallet':
      if (method.ewalletProvider) details.push(`Provider: ${method.ewalletProvider}`);
      if (method.ewalletPhone) details.push(`No. HP: ${method.ewalletPhone}`);
      break;
    case 'virtual_account':
      if (method.vaProvider) details.push(`Provider: ${method.vaProvider}`);
      if (method.vaNumber) details.push(`No. VA: ${method.vaNumber}`);
      if (method.vaCompanyName) details.push(`Perusahaan: ${method.vaCompanyName}`);
      break;
    case 'kartu_debit':
    case 'kartu_kredit':
      if (method.cardProvider) details.push(`Kartu: ${method.cardProvider}`);
      if (method.paymentGateway) details.push(`Gateway: ${method.paymentGateway}`);
      break;
  }
  return details;
}

function methodToForm(method: PaymentMethod): FormData {
  return {
    name: method.name,
    type: method.type,
    description: method.description,
    isActive: method.isActive,
    isDefault: method.isDefault,
    order: method.order,
    bankName: method.bankName ?? '',
    accountNumber: method.accountNumber ?? '',
    accountHolder: method.accountHolder ?? '',
    branch: method.branch ?? '',
    swiftCode: method.swiftCode ?? '',
    transferInstructions: method.transferInstructions ?? '',
    qrImageUrl: method.qrImageUrl ?? '',
    merchantName: method.merchantName ?? '',
    merchantId: method.merchantId ?? '',
    qrisInstructions: method.qrisInstructions ?? '',
    ewalletProvider: method.ewalletProvider ?? 'GoPay',
    ewalletPhone: method.ewalletPhone ?? '',
    ewalletQrUrl: method.ewalletQrUrl ?? '',
    ewalletInstructions: method.ewalletInstructions ?? '',
    vaProvider: method.vaProvider ?? '',
    vaNumber: method.vaNumber ?? '',
    vaCompanyName: method.vaCompanyName ?? '',
    vaInstructions: method.vaInstructions ?? '',
    cardProvider: method.cardProvider ?? 'Visa',
    paymentGateway: method.paymentGateway ?? 'Midtrans',
    manualInstructions: method.manualInstructions ?? '',
  };
}

function formToMethod(form: FormData, id?: string): PaymentMethod {
  return {
    id: id ?? Date.now().toString(),
    name: form.name,
    type: form.type,
    description: form.description,
    isActive: form.isActive,
    isDefault: form.isDefault,
    order: form.order,
    bankName: form.bankName || undefined,
    accountNumber: form.accountNumber || undefined,
    accountHolder: form.accountHolder || undefined,
    branch: form.branch || undefined,
    swiftCode: form.swiftCode || undefined,
    transferInstructions: form.transferInstructions || undefined,
    qrImageUrl: form.qrImageUrl || undefined,
    merchantName: form.merchantName || undefined,
    merchantId: form.merchantId || undefined,
    qrisInstructions: form.qrisInstructions || undefined,
    ewalletProvider: form.ewalletProvider || undefined,
    ewalletPhone: form.ewalletPhone || undefined,
    ewalletQrUrl: form.ewalletQrUrl || undefined,
    ewalletInstructions: form.ewalletInstructions || undefined,
    vaProvider: form.vaProvider || undefined,
    vaNumber: form.vaNumber || undefined,
    vaCompanyName: form.vaCompanyName || undefined,
    vaInstructions: form.vaInstructions || undefined,
    cardProvider: form.cardProvider || undefined,
    paymentGateway: form.paymentGateway || undefined,
    manualInstructions: form.manualInstructions || undefined,
  };
}

function validateForm(form: FormData): string | null {
  if (!form.name.trim()) return 'Nama metode pembayaran wajib diisi';
  if (form.type === 'transfer_bank') {
    if (!form.bankName.trim()) return 'Nama bank wajib diisi';
    if (!form.accountNumber.trim()) return 'Nomor rekening wajib diisi';
    if (!form.accountHolder.trim()) return 'Nama pemilik rekening wajib diisi';
  }
  if (form.type === 'qris') {
    if (!form.merchantName.trim()) return 'Nama merchant wajib diisi';
  }
  if (form.type === 'ewallet') {
    if (!form.ewalletPhone.trim()) return 'Nomor telepon wajib diisi';
  }
  if (form.type === 'virtual_account') {
    if (!form.vaProvider.trim()) return 'Provider VA wajib diisi';
    if (!form.vaNumber.trim()) return 'Nomor Virtual Account wajib diisi';
  }
  if (form.type === 'kartu_debit' || form.type === 'kartu_kredit') {
    if (!form.cardProvider) return 'Provider kartu wajib dipilih';
    if (!form.paymentGateway) return 'Payment gateway wajib dipilih';
  }
  return null;
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Component ───────────────────────────────────────────────────────────────

interface PaymentMethodSettingsProps {
  onBack?: () => void;
}

export default function PaymentMethodSettings({ onBack }: PaymentMethodSettingsProps) {
  // ── State ──
  const [methods, setMethods] = useState<PaymentMethod[]>(MOCK_METHODS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<PaymentMethod | null>(null);

  // ── Filtered Methods ──
  const filteredMethods = useMemo(() => {
    return methods.filter((m) => {
      const matchSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchType = filterType === 'all' || m.type === filterType;
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && m.isActive) ||
        (filterStatus === 'inactive' && !m.isActive);
      return matchSearch && matchType && matchStatus;
    });
  }, [methods, searchQuery, filterType, filterStatus]);

  // ── Handlers ──
  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, order: methods.length + 1 });
    setDialogOpen(true);
  };

  const handleOpenEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setForm(methodToForm(method));
    setDialogOpen(true);
  };

  const handleSave = () => {
    const error = validateForm(form);
    if (error) {
      toast.error(error);
      return;
    }

    if (editingId) {
      setMethods((prev) =>
        prev.map((m) => (m.id === editingId ? formToMethod(form, editingId) : m))
      );
      toast.success('Metode pembayaran berhasil diperbarui');
    } else {
      const newMethod = formToMethod(form);
      setMethods((prev) => [...prev, newMethod]);
      toast.success('Metode pembayaran berhasil ditambahkan');
    }
    setDialogOpen(false);
  };

  const handleSetDefault = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => ({ ...m, isDefault: m.id === id }))
    );
    toast.success('Metode default berhasil diubah');
  };

  const handleToggleActive = (id: string) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m))
    );
    const method = methods.find((m) => m.id === id);
    toast.success(
      method?.isActive
        ? 'Metode pembayaran dinonaktifkan'
        : 'Metode pembayaran diaktifkan'
    );
  };

  const handleDuplicate = (method: PaymentMethod) => {
    const duplicate: PaymentMethod = {
      ...method,
      id: Date.now().toString(),
      name: `${method.name} (Salinan)`,
      isDefault: false,
      order: methods.length + 1,
    };
    setMethods((prev) => [...prev, duplicate]);
    toast.success('Metode pembayaran berhasil diduplikat');
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.isDefault) {
      toast.error('Tidak bisa menghapus metode default');
      setDeleteTarget(null);
      return;
    }
    setMethods((prev) => prev.filter((m) => m.id !== deleteTarget.id));
    toast.success('Metode pembayaran berhasil dihapus');
    setDeleteTarget(null);
  };

  const handleTypeChange = (newType: PaymentType) => {
    setForm((prev) => ({ ...prev, type: newType }));
  };

  // ── Type-specific form fields ──
  const renderTypeFields = () => {
    switch (form.type) {
      case 'transfer_bank':
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Detail Transfer Bank</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Nama Bank <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Contoh: BCA, Mandiri, BNI"
                  value={form.bankName}
                  onChange={(e) => setForm((p) => ({ ...p, bankName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Nomor Rekening <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Contoh: 123-456-7890"
                  value={form.accountNumber}
                  onChange={(e) => setForm((p) => ({ ...p, accountNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Atas Nama <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nama pemilik rekening"
                  value={form.accountHolder}
                  onChange={(e) => setForm((p) => ({ ...p, accountHolder: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Cabang</Label>
                <Input
                  placeholder="Contoh: KCP Kelapa Gading"
                  value={form.branch}
                  onChange={(e) => setForm((p) => ({ ...p, branch: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  SWIFT Code <span className="text-muted-foreground text-xs">(opsional)</span>
                </Label>
                <Input
                  placeholder="Contoh: CENAIDJA"
                  value={form.swiftCode}
                  onChange={(e) => setForm((p) => ({ ...p, swiftCode: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo Bank</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => toast.info('Fitur upload logo akan segera tersedia')}
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    Upload
                  </Button>
                  {form.logoUrl && (
                    <span className="text-xs text-muted-foreground truncate">Logo terupload</span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instruksi Transfer</Label>
              <Textarea
                placeholder="Instruksi pembayaran untuk pelanggan..."
                value={form.transferInstructions}
                onChange={(e) => setForm((p) => ({ ...p, transferInstructions: e.target.value }))}
                rows={3}
              />
            </div>
          </motion.div>
        );

      case 'qris':
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Detail QRIS</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Upload Gambar QR</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => toast.info('Fitur upload QR akan segera tersedia')}
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    Upload QR
                  </Button>
                  {form.qrImageUrl && (
                    <span className="text-xs text-muted-foreground truncate">QR terupload</span>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>
                  Nama Merchant <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Nama merchant QRIS"
                  value={form.merchantName}
                  onChange={(e) => setForm((p) => ({ ...p, merchantName: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Merchant ID</Label>
                <Input
                  placeholder="Contoh: QR-MERCHANT-001"
                  value={form.merchantId}
                  onChange={(e) => setForm((p) => ({ ...p, merchantId: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instruksi QRIS</Label>
              <Textarea
                placeholder="Instruksi pembayaran QRIS untuk pelanggan..."
                value={form.qrisInstructions}
                onChange={(e) => setForm((p) => ({ ...p, qrisInstructions: e.target.value }))}
                rows={3}
              />
            </div>
          </motion.div>
        );

      case 'ewallet':
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Detail E-Wallet</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Provider</Label>
                <Select
                  value={form.ewalletProvider}
                  onValueChange={(v) => setForm((p) => ({ ...p, ewalletProvider: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih provider" />
                  </SelectTrigger>
                  <SelectContent>
                    {EWALLET_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Nomor Telepon <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="08xx-xxxx-xxxx"
                  value={form.ewalletPhone}
                  onChange={(e) => setForm((p) => ({ ...p, ewalletPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Upload QR E-Wallet</Label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => toast.info('Fitur upload QR akan segera tersedia')}
                  >
                    <Upload className="mr-1.5 h-4 w-4" />
                    Upload QR
                  </Button>
                  {form.ewalletQrUrl && (
                    <span className="text-xs text-muted-foreground truncate">QR terupload</span>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instruksi E-Wallet</Label>
              <Textarea
                placeholder="Instruksi pembayaran e-wallet untuk pelanggan..."
                value={form.ewalletInstructions}
                onChange={(e) => setForm((p) => ({ ...p, ewalletInstructions: e.target.value }))}
                rows={3}
              />
            </div>
          </motion.div>
        );

      case 'virtual_account':
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">Detail Virtual Account</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Provider <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Contoh: BCA, Mandiri, Permata"
                  value={form.vaProvider}
                  onChange={(e) => setForm((p) => ({ ...p, vaProvider: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>
                  Nomor VA <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Contoh: 8810-7777-1234-5678"
                  value={form.vaNumber}
                  onChange={(e) => setForm((p) => ({ ...p, vaNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Nama Perusahaan</Label>
                <Input
                  placeholder="Nama perusahaan yang terdaftar"
                  value={form.vaCompanyName}
                  onChange={(e) => setForm((p) => ({ ...p, vaCompanyName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Instruksi Virtual Account</Label>
              <Textarea
                placeholder="Instruksi pembayaran VA untuk pelanggan..."
                value={form.vaInstructions}
                onChange={(e) => setForm((p) => ({ ...p, vaInstructions: e.target.value }))}
                rows={3}
              />
            </div>
          </motion.div>
        );

      case 'kartu_debit':
      case 'kartu_kredit':
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">
              Detail {form.type === 'kartu_debit' ? 'Kartu Debit' : 'Kartu Kredit'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Provider Kartu <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.cardProvider}
                  onValueChange={(v) => setForm((p) => ({ ...p, cardProvider: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih provider kartu" />
                  </SelectTrigger>
                  <SelectContent>
                    {CARD_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>
                  Payment Gateway <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={form.paymentGateway}
                  onValueChange={(v) => setForm((p) => ({ ...p, paymentGateway: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih payment gateway" />
                  </SelectTrigger>
                  <SelectContent>
                    {GATEWAY_PROVIDERS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        );

      case 'manual':
      case 'lainnya':
        return (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <Separator />
            <p className="text-sm font-medium text-muted-foreground">
              Detail {form.type === 'manual' ? 'Manual' : 'Lainnya'}
            </p>
            <div className="space-y-2">
              <Label>Instruksi Pembayaran</Label>
              <Textarea
                placeholder="Instruksi pembayaran untuk pelanggan..."
                value={form.manualInstructions}
                onChange={(e) => setForm((p) => ({ ...p, manualInstructions: e.target.value }))}
                rows={3}
              />
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  // ── Render ──
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Header ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="mt-0.5 shrink-0"
              onClick={onBack}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Metode Pembayaran</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Kelola metode pembayaran yang tersedia di kasir Anda
            </p>
          </div>
        </div>
        <Button onClick={handleOpenAdd} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          Tambah Metode Pembayaran
        </Button>
      </motion.div>

      {/* ── Search & Filter ── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari metode pembayaran..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <Filter className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue placeholder="Jenis" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Jenis</SelectItem>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* ── Payment Method Cards ── */}
      {filteredMethods.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="rounded-2xl">
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
                <CreditCard className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg">Belum ada metode pembayaran</h3>
              <p className="text-muted-foreground text-sm mt-1 max-w-sm">
                {searchQuery || filterType !== 'all' || filterStatus !== 'all'
                  ? 'Tidak ditemukan metode pembayaran sesuai filter. Coba ubah pencarian atau filter Anda.'
                  : 'Mulai tambahkan metode pembayaran pertama Anda untuk menerima transaksi.'}
              </p>
              {!searchQuery && filterType === 'all' && filterStatus === 'all' && (
                <Button onClick={handleOpenAdd} className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Metode Pembayaran
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} className="grid grid-cols-1 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredMethods.map((method) => {
              const Icon = getTypeIcon(method.type);
              const details = getMethodDetails(method);

              return (
                <motion.div
                  key={method.id}
                  variants={itemVariants}
                  layout
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -8 }}
                  transition={{ duration: 0.25 }}
                >
                  <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Icon */}
                        <div
                          className={`${TYPE_ICON_COLORS[method.type]} h-12 w-12 rounded-2xl flex items-center justify-center shrink-0`}
                        >
                          <Icon className="h-6 w-6 text-white" />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Name + Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className={`font-semibold text-base ${!method.isActive ? 'text-muted-foreground' : ''}`}>
                              {method.name}
                            </h3>
                            <Badge
                              variant="secondary"
                              className={TYPE_BADGE_COLORS[method.type]}
                            >
                              {TYPE_LABELS[method.type]}
                            </Badge>
                            <Badge
                              className={
                                method.isActive
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }
                            >
                              {method.isActive ? 'Aktif' : 'Nonaktif'}
                            </Badge>
                            {method.isDefault && (
                              <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Default
                              </Badge>
                            )}
                          </div>

                          {/* Description */}
                          {method.description && (
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {method.description}
                            </p>
                          )}

                          {/* Type-specific details */}
                          {details.length > 0 && (
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                              {details.map((d, i) => (
                                <span key={i} className="flex items-center gap-1">
                                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Action buttons */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => handleOpenEdit(method)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </Button>
                            {!method.isDefault && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs gap-1.5"
                                onClick={() => handleSetDefault(method.id)}
                              >
                                <Star className="h-3.5 w-3.5" />
                                Jadikan Default
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-8 text-xs gap-1.5 ${
                                method.isActive
                                  ? 'text-amber-600 hover:text-amber-700 dark:text-amber-400'
                                  : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400'
                              }`}
                              onClick={() => handleToggleActive(method.id)}
                            >
                              <Power className="h-3.5 w-3.5" />
                              {method.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1.5"
                              onClick={() => handleDuplicate(method)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Duplikat
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1.5 text-destructive hover:text-destructive"
                              onClick={() => setDeleteTarget(method)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Hapus
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* ── Add/Edit Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Ubah detail metode pembayaran yang sudah ada.'
                : 'Isi detail metode pembayaran baru yang ingin ditambahkan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* General Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label>
                  Nama Metode <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="Contoh: Transfer BCA, QRIS, GoPay"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Pembayaran</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => handleTypeChange(v as PaymentType)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih jenis" />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Urutan</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.order}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, order: parseInt(e.target.value) || 0 }))
                  }
                />
              </div>

              <div className="space-y-2 sm:col-span-2">
                <Label>Deskripsi</Label>
                <Textarea
                  placeholder="Deskripsi singkat metode pembayaran ini..."
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Status Aktif</Label>
                  <p className="text-xs text-muted-foreground">
                    Metode akan ditampilkan di kasir jika aktif
                  </p>
                </div>
                <Switch
                  checked={form.isActive}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isActive: v }))}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="space-y-0.5">
                  <Label className="text-sm font-medium">Jadikan Default</Label>
                  <p className="text-xs text-muted-foreground">
                    Otomatis dipilih saat transaksi baru
                  </p>
                </div>
                <Switch
                  checked={form.isDefault}
                  onCheckedChange={(v) => setForm((p) => ({ ...p, isDefault: v }))}
                />
              </div>
            </div>

            {/* Type-specific fields */}
            <AnimatePresence mode="wait">
              {renderTypeFields()}
            </AnimatePresence>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 pt-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Simpan Perubahan' : 'Tambah Metode'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation Dialog ── */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle>Hapus Metode Pembayaran?</AlertDialogTitle>
                <AlertDialogDescription className="mt-1">
                  Anda yakin ingin menghapus metode &quot;{deleteTarget?.name}&quot;? Tindakan ini tidak dapat dibatalkan.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
