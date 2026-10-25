'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Crown,
  Gem,
  Zap,
  Shield,
  ArrowLeft,
  Package,
  Building2,
  Users,
  HardDrive,
  Bot,
  Sparkles,
  BarChart3,
  Database,
  Globe,
  Headphones,
  FileText,
  QrCode,
  Webhook,
  Warehouse,
  Store,
  MessageSquare,
  Lock,
  Clock,
  ChevronRight,
  Star,
  Rocket,
  TrendingUp,
  FileDown,
  FileSpreadsheet,
  CreditCard,
  ScanBarcode,
  UserCog,
  Truck,
  PieChart,
  Receipt,
  Download,
  CloudUpload,
  LayoutDashboard,
  Brain,
  LineChart,
  ShoppingCart,
  Phone,
  Link2,
  BadgeCheck,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SubscriptionSettingsProps {
  onBack?: () => void;
}

interface PlanFeature {
  label: string;
  included: boolean;
  icon?: React.ElementType;
}

interface PricingPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  description: string;
  icon: React.ElementType;
  badge?: string;
  highlighted?: boolean;
  premium?: boolean;
  features: PlanFeature[];
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const CURRENT_PLAN = {
  name: 'Gratis',
  status: 'Aktif',
  berlaku: 'Selamanya',
  nextPlan: 'Pro',
  nextPrice: 'Rp 99.000/bulan',
};

const USAGE_METRICS = [
  {
    label: 'Produk',
    icon: Package,
    current: 165,
    limit: 200,
    unit: '',
    color: 'text-[#735c00] dark:text-[#e9c349]',
    barColor: '[&>div]:bg-[#735c00]',
  },
  {
    label: 'Cabang',
    icon: Building2,
    current: 1,
    limit: 1,
    unit: '',
    color: 'text-blue-600 dark:text-blue-400',
    barColor: '[&>div]:bg-blue-500',
  },
  {
    label: 'Pengguna',
    icon: Users,
    current: 2,
    limit: 2,
    unit: '',
    color: 'text-violet-600 dark:text-violet-400',
    barColor: '[&>div]:bg-violet-500',
  },
  {
    label: 'Storage',
    icon: HardDrive,
    current: 245,
    limit: 500,
    unit: ' MB',
    color: 'text-amber-600 dark:text-amber-400',
    barColor: '[&>div]:bg-amber-500',
  },
  {
    label: 'AI Hari Ini',
    icon: Bot,
    current: 8,
    limit: 10,
    unit: '',
    color: 'text-rose-600 dark:text-rose-400',
    barColor: '[&>div]:bg-rose-500',
  },
];

const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'gratis',
    name: 'Gratis',
    price: 'Rp 0',
    period: 'Selamanya gratis',
    description: 'Untuk bisnis kecil yang baru memulai',
    icon: Gem,
    features: [
      { label: '200 Produk', included: true, icon: Package },
      { label: '1 Cabang', included: true, icon: Building2 },
      { label: '2 Pengguna', included: true, icon: Users },
      { label: 'Transaksi Unlimited', included: true, icon: Receipt },
      { label: 'Kasir', included: true, icon: ScanBarcode },
      { label: 'Barcode Scanner', included: true, icon: ScanBarcode },
      { label: 'Manajemen Produk & Stok', included: true, icon: Package },
      { label: 'Pembelian', included: true, icon: ShoppingCart },
      { label: 'Supplier', included: true, icon: Truck },
      { label: 'Pelanggan', included: true, icon: Users },
      { label: 'Laporan Dasar', included: true, icon: PieChart },
      { label: 'Export Excel', included: true, icon: FileSpreadsheet },
      { label: 'Backup Manual', included: true, icon: Download },
      { label: 'Storage 500 MB', included: true, icon: HardDrive },
      { label: 'AI Assistant 10 chat/hari', included: true, icon: Bot },
      { label: 'Ringkasan Penjualan AI', included: true, icon: BarChart3 },
      { label: 'Tanya AI', included: true, icon: Brain },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 'Rp 99.000',
    period: '/bulan',
    description: 'Untuk bisnis yang berkembang pesat',
    icon: Crown,
    badge: 'POPULER',
    highlighted: true,
    features: [
      { label: 'Produk Unlimited', included: true, icon: Package },
      { label: '5 Cabang', included: true, icon: Building2 },
      { label: '20 Pengguna', included: true, icon: Users },
      { label: 'Storage 20 GB', included: true, icon: HardDrive },
      { label: 'Backup Otomatis', included: true, icon: CloudUpload },
      { label: 'Export PDF & Excel', included: true, icon: FileDown },
      { label: 'Dashboard Lengkap', included: true, icon: LayoutDashboard },
      { label: 'AI Premium 500 chat/bulan', included: true, icon: Sparkles },
      { label: 'Prediksi Penjualan & Restock', included: true, icon: TrendingUp },
      { label: 'Analisis Bisnis', included: true, icon: BarChart3 },
      { label: 'QRIS', included: true, icon: QrCode },
      { label: 'API Dasar', included: true, icon: Globe },
      { label: 'Prioritas Support', included: true, icon: Headphones },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Rp 249.000',
    period: '/bulan',
    description: 'Solusi lengkap untuk bisnis besar',
    icon: Rocket,
    premium: true,
    features: [
      { label: 'Semua fitur Pro', included: true, icon: Crown },
      { label: 'Cabang Unlimited', included: true, icon: Building2 },
      { label: 'Pengguna Unlimited', included: true, icon: Users },
      { label: 'Storage Unlimited', included: true, icon: HardDrive },
      { label: 'AI Unlimited', included: true, icon: Sparkles },
      { label: 'Forecast Penjualan & Keuangan', included: true, icon: LineChart },
      { label: 'Multi Gudang & Kasir', included: true, icon: Warehouse },
      { label: 'Marketplace Integration', included: true, icon: Store },
      { label: 'WhatsApp Integration', included: true, icon: Phone },
      { label: 'Payment Gateway', included: true, icon: CreditCard },
      { label: 'API Lengkap', included: true, icon: Globe },
      { label: 'Webhook', included: true, icon: Webhook },
      { label: 'Audit Log', included: true, icon: ClipboardList },
      { label: 'Dedicated Account Manager', included: true, icon: UserCog },
    ],
  },
];

// ─── Animation Variants ─────────────────────────────────────────────────────

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const cardHover = {
  scale: 1.02,
  transition: { duration: 0.2, ease: 'easeOut' },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

function getUsageColor(percent: number): string {
  if (percent >= 90) return '[&>div]:bg-red-500';
  if (percent >= 75) return '[&>div]:bg-amber-500';
  return '[&>div]:bg-[#735c00]';
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function SubscriptionSettings({ onBack }: SubscriptionSettingsProps) {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setShowUpgradeDialog(true);
  };

  const confirmUpgrade = () => {
    setIsUpgrading(true);
    setTimeout(() => {
      setIsUpgrading(false);
      setShowUpgradeDialog(false);
      setSelectedPlan(null);
    }, 2000);
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* ─── Header ─────────────────────────────────────────────── */}
      <motion.div variants={item} className="flex items-center gap-3">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Langganan</h1>
          <p className="text-sm text-muted-foreground">
            Kelola paket berlangganan dan pantau penggunaan Anda
          </p>
        </div>
      </motion.div>

      {/* ─── Section 1: Current Plan Card ────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-2xl border-0 shadow-md overflow-hidden bg-gradient-to-br from-[#2c1810] via-white to-teal-50 dark:from-[#2c1810]/30 dark:via-card dark:to-teal-950/20">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#ffe088]/40 dark:bg-[#2c1810]/50">
                  <Gem className="h-7 w-7 text-[#735c00] dark:text-[#e9c349]" />
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold">Paket {CURRENT_PLAN.name}</h2>
                    <Badge className="bg-[#ffe088]/40 text-[#4a2c20] hover:bg-[#ffe088]/40 dark:bg-[#2c1810]/50 dark:text-[#e9c349] border-0">
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-[#735c00] animate-pulse" />
                      {CURRENT_PLAN.status}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      Berlaku {CURRENT_PLAN.berlaku}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5" />
                      Plan Starter
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:items-end gap-2">
                <Button
                  onClick={() => handleUpgrade(PRICING_PLANS[1])}
                  className="bg-gradient-to-r from-[#2c1810] to-teal-500 hover:from-[#2c1810] hover:to-teal-600 text-white rounded-xl px-6 shadow-lg shadow-[#735c00]/25"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Upgrade ke Pro
                  <ChevronRight className="ml-1.5 h-4 w-4" />
                </Button>
                <span className="text-xs text-muted-foreground">
                  Mulai dari {CURRENT_PLAN.nextPrice}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ─── Section 2: Usage Dashboard ──────────────────────────── */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
            Penggunaan
          </h2>
          <Badge variant="outline" className="text-xs font-normal">
            Paket {CURRENT_PLAN.name}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {USAGE_METRICS.map((metric) => {
            const percent = Math.min((metric.current / metric.limit) * 100, 100);
            const isNearLimit = percent >= 90;
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.label}
                whileHover={cardHover}
                variants={item}
              >
                <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-muted ${metric.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-sm font-medium text-muted-foreground">
                          {metric.label}
                        </span>
                      </div>
                      {isNearLimit && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                          Penuh
                        </Badge>
                      )}
                    </div>
                    <div>
                      <div className="flex items-baseline gap-1 mb-1.5">
                        <span className={`text-2xl font-bold ${isNearLimit ? 'text-red-600 dark:text-red-400' : ''}`}>
                          {metric.current}
                          <span className="text-sm font-normal text-muted-foreground">{metric.unit}</span>
                        </span>
                        <span className="text-sm text-muted-foreground">/ {metric.limit}{metric.unit}</span>
                      </div>
                      <Progress
                        value={percent}
                        className={`h-2 rounded-full ${getUsageColor(percent)}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <Separator />

      {/* ─── Section 3: Pricing Cards ─────────────────────────────── */}
      <motion.div variants={item} className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold">Pilih Paket Anda</h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Pilih paket yang sesuai dengan kebutuhan bisnis Anda. Upgrade atau downgrade kapan saja.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {PRICING_PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.id === 'gratis';

            return (
              <motion.div
                key={plan.id}
                variants={item}
                whileHover={!isCurrentPlan ? cardHover : undefined}
                className={plan.highlighted ? 'md:-mt-4 md:mb-[-16px]' : plan.premium ? 'md:-mt-2' : ''}
              >
                <Card
                  className={`
                    rounded-2xl relative overflow-hidden transition-all duration-300
                    ${plan.highlighted
                      ? 'border-2 border-[#735c00] dark:border-[#e9c349] shadow-lg shadow-[#735c00]/10'
                      : plan.premium
                        ? 'border-2 border-amber-300 dark:border-amber-600/50 shadow-lg shadow-amber-500/10'
                        : 'border shadow-sm hover:shadow-md'
                    }
                    ${isCurrentPlan ? 'ring-1 ring-primary/20' : ''}
                  `}
                >
                  {/* Badge */}
                  {plan.badge && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-[#2c1810] to-teal-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-xl">
                        {plan.badge}
                      </div>
                    </div>
                  )}
                  {plan.premium && (
                    <div className="absolute top-0 right-0">
                      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-bl-xl">
                        PREMIUM
                      </div>
                    </div>
                  )}

                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className={
                        `flex h-11 w-11 items-center justify-center rounded-xl
                        ${plan.highlighted
                          ? 'bg-[#ffe088]/40 dark:bg-[#2c1810]/50'
                          : plan.premium
                            ? 'bg-amber-100 dark:bg-amber-900/50'
                            : 'bg-muted'
                        }`
                      }>
                        <Icon className={
                          `h-5 w-5
                          ${plan.highlighted
                            ? 'text-[#735c00] dark:text-[#e9c349]'
                            : plan.premium
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground'
                          }`
                        } />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold flex items-center gap-2">
                          {plan.name}
                          {isCurrentPlan && (
                            <Badge variant="outline" className="text-[10px] font-normal px-1.5 py-0">
                              Paket Saat Ini
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {plan.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-5">
                    {/* Price */}
                    <div>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-extrabold tracking-tight">
                          {plan.price}
                        </span>
                        {plan.period !== 'Selamanya gratis' && (
                          <span className="text-sm text-muted-foreground">
                            {plan.period}
                          </span>
                        )}
                      </div>
                      {plan.period === 'Selamanya gratis' && (
                        <span className="text-sm text-muted-foreground">
                          {plan.period}
                        </span>
                      )}
                    </div>

                    <Separator />

                    {/* Features */}
                    <div className="space-y-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Termasuk
                      </p>
                      <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
                        {plan.features.map((feature) => {
                          const FeatureIcon = feature.icon;
                          return (
                            <li key={feature.label} className="flex items-start gap-2.5">
                              <div className={
                                `flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5
                                ${feature.included
                                  ? plan.highlighted
                                    ? 'bg-[#ffe088]/40 dark:bg-[#2c1810]/50'
                                    : plan.premium
                                      ? 'bg-amber-100 dark:bg-amber-900/50'
                                      : 'bg-[#ffe088]/40 dark:bg-[#2c1810]/50'
                                  : 'bg-red-100 dark:bg-red-900/50'
                                }`
                              }>
                                {feature.included ? (
                                  <Check className={`h-3 w-3 ${plan.highlighted ? 'text-[#735c00] dark:text-[#e9c349]' : plan.premium ? 'text-amber-600 dark:text-amber-400' : 'text-[#735c00] dark:text-[#e9c349]'}`} />
                                ) : (
                                  <X className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-sm">
                                {FeatureIcon && (
                                  <FeatureIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                )}
                                <span className={!feature.included ? 'text-muted-foreground line-through' : ''}>
                                  {feature.label}
                                </span>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* CTA Button */}
                    <Button
                      className={
                        `w-full rounded-xl py-5 font-semibold transition-all
                        ${isCurrentPlan
                          ? 'bg-muted text-muted-foreground cursor-default hover:bg-muted'
                          : plan.highlighted
                            ? 'bg-gradient-to-r from-[#2c1810] to-teal-500 hover:from-[#2c1810] hover:to-teal-600 text-white shadow-lg shadow-[#735c00]/25'
                            : plan.premium
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25'
                              : 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        }`
                      }
                      disabled={isCurrentPlan}
                      onClick={() => !isCurrentPlan && handleUpgrade(plan)}
                    >
                      {isCurrentPlan ? (
                        <>
                          <BadgeCheck className="mr-2 h-4 w-4" />
                          Paket Aktif
                        </>
                      ) : (
                        <>
                          <Zap className="mr-2 h-4 w-4" />
                          {plan.id === 'pro' ? 'Upgrade ke Pro' : 'Upgrade ke Enterprise'}
                          <ChevronRight className="ml-1.5 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* ─── Upgrade Confirmation Dialog ──────────────────────────── */}
      <AnimatePresence>
        {showUpgradeDialog && selectedPlan && (
          <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={
                      `flex h-12 w-12 items-center justify-center rounded-xl
                      ${selectedPlan.highlighted
                        ? 'bg-[#ffe088]/40 dark:bg-[#2c1810]/50'
                        : 'bg-amber-100 dark:bg-amber-900/50'
                      }`
                    }>
                      <selectedPlan.icon className={
                        `h-6 w-6
                        ${selectedPlan.highlighted
                          ? 'text-[#735c00] dark:text-[#e9c349]'
                          : 'text-amber-600 dark:text-amber-400'
                        }`
                      } />
                    </div>
                    <DialogTitle className="text-xl">
                      Upgrade ke {selectedPlan.name}
                    </DialogTitle>
                    <DialogDescription>
                      Anda akan upgrade dari paket <strong>Gratis</strong> ke paket{' '}
                      <strong>{selectedPlan.name}</strong>.
                    </DialogDescription>
                  </div>
                </DialogHeader>

                <div className="rounded-xl bg-muted/50 p-4 space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Paket</span>
                    <span className="font-semibold">{selectedPlan.name}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Harga</span>
                    <span className="font-semibold">{selectedPlan.price}{selectedPlan.period !== 'Selamanya gratis' ? ` ${selectedPlan.period}` : ''}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Fitur</span>
                    <span className="font-semibold">{selectedPlan.features.length} fitur</span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span>Total hari ini</span>
                    <span>{selectedPlan.price}</span>
                  </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl flex-1"
                    onClick={() => setShowUpgradeDialog(false)}
                    disabled={isUpgrading}
                  >
                    Batal
                  </Button>
                  <Button
                    className={
                      `rounded-xl flex-1
                      ${selectedPlan.highlighted
                        ? 'bg-gradient-to-r from-[#2c1810] to-teal-500 hover:from-[#2c1810] hover:to-teal-600 text-white shadow-lg shadow-[#735c00]/25'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-amber-500/25'
                      }`
                    }
                    onClick={confirmUpgrade}
                    disabled={isUpgrading}
                  >
                    {isUpgrading ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="mr-2"
                        >
                          <Star className="h-4 w-4" />
                        </motion.div>
                        Memproses...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Konfirmasi Upgrade
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </motion.div>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
