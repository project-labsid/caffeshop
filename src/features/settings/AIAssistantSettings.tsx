'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Check,
  Clock,
  RefreshCw,
  History,
  Crown,
  MessageSquare,
  Zap,
  Sparkles,
  TrendingUp,
  BarChart3,
  Users,
  Package,
  ShoppingBag,
  Lightbulb,
  Bot,
  ChevronRight,
  AlertTriangle,
  FileBarChart,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

interface AIAssistantSettingsProps {
  onBack?: () => void;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_STATUS = {
  isActive: true,
  provider: 'AI Cloud Kasir Kopi',
  model: 'GPT-5',
  mode: 'Cloud AI',
  plan: 'Starter',
};

const MOCK_USAGE = {
  chatToday: 8,
  chatTodayLimit: 10,
  chatMonth: 126,
};

const AI_FEATURES = [
  { label: 'Chat AI', icon: MessageSquare, enabled: true },
  { label: 'Ringkasan Penjualan', icon: BarChart3, enabled: true },
  { label: 'Analisis Laporan', icon: FileBarChart, enabled: true },
  { label: 'Prediksi Restock', icon: TrendingUp, enabled: true },
  { label: 'Analisis Produk Terlaris', icon: ShoppingBag, enabled: true },
  { label: 'Analisis Pelanggan', icon: Users, enabled: true },
  { label: 'Insight Bisnis', icon: Lightbulb, enabled: true },
  { label: 'Ringkasan Stok', icon: Package, enabled: true },
  { label: 'Rekomendasi Pembelian', icon: Sparkles, enabled: true },
  { label: 'Tanya AI', icon: Bot, enabled: true },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function getTimeUntilMidnight(): string {
  const now = new Date();
  // WIB = UTC+7
  const wibOffset = 7 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const wib = new Date(utc + wibOffset * 60000);

  const midnight = new Date(wib);
  midnight.setHours(24, 0, 0, 0);

  const diff = midnight.getTime() - wib.getTime();
  if (diff <= 0) return '00:00:00';

  const hours = Math.floor(diff / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

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

// ─── Component ──────────────────────────────────────────────────────────────

export default function AIAssistantSettings({ onBack }: AIAssistantSettingsProps) {
  const [countdown, setCountdown] = useState(() => getTimeUntilMidnight());
  const [showQuotaDialog, setShowQuotaDialog] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const countdownRef = useRef<ReturnType<typeof setInterval>>();

  const usagePercent = Math.min(
    (MOCK_USAGE.chatToday / MOCK_USAGE.chatTodayLimit) * 100,
    100
  );
  const isQuotaLow = MOCK_USAGE.chatToday >= MOCK_USAGE.chatTodayLimit * 0.8;
  const isQuotaExceeded = MOCK_USAGE.chatToday >= MOCK_USAGE.chatTodayLimit;

  // Countdown timer — uses interval callback only (no synchronous setState in effect body)
  useEffect(() => {
    countdownRef.current = setInterval(() => {
      setCountdown(getTimeUntilMidnight());
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const handleResetQuota = useCallback(() => {
    if (isQuotaExceeded) {
      setShowQuotaDialog(true);
      return;
    }
    setIsResetting(true);
    // Simulate reset
    setTimeout(() => setIsResetting(false), 1500);
  }, [isQuotaExceeded]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      {/* ── AI Status Dashboard ──────────────────────────────────────── */}
      <motion.div variants={item}>
        <Card className="rounded-2xl border-0 shadow-sm bg-gradient-to-br from-[#2c1810] to-teal-50 dark:from-[#2c1810]/30 dark:to-teal-950/20 overflow-hidden relative">
          {/* Decorative glow */}
          <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-[#e9c349]/10 dark:bg-[#e9c349]/5 blur-3xl pointer-events-none" />
          <CardContent className="p-5 sm:p-6 relative">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Left: Status info */}
              <div className="flex items-start gap-4">
                <div className="relative mt-0.5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#735c00] shadow-lg shadow-[#735c00]/20">
                    <Brain className="h-6 w-6 text-white" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#e9c349] opacity-75" />
                    <span className="relative inline-flex h-4 w-4 rounded-full bg-[#735c00] ring-2 ring-white dark:ring-background" />
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-foreground">
                      Asisten AI
                    </h3>
                    <Badge
                      variant="secondary"
                      className="bg-[#ffe088]/40 text-[#4a2c20] dark:bg-[#2c1810]/50 dark:text-[#ffe088] border-0 text-xs font-medium px-2 py-0.5"
                    >
                      Active
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Zap className="h-3.5 w-3.5 text-[#735c00]" />
                      {MOCK_STATUS.provider}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Bot className="h-3.5 w-3.5 text-[#735c00]" />
                      {MOCK_STATUS.model}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-[#735c00]" />
                      {MOCK_STATUS.mode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Plan badge */}
              <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                <Badge
                  variant="outline"
                  className="border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-300 px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full"
                >
                  <Crown className="mr-1.5 h-3 w-3" />
                  {MOCK_STATUS.plan}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Pakai saat ini
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ── Two Column Grid: Features + Usage ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* ── AI Features ─────────────────────────────────────────────── */}
        <motion.div variants={item}>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffe088]/40 dark:bg-[#2c1810]/40">
                  <Sparkles className="h-4 w-4 text-[#735c00] dark:text-[#e9c349]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Fitur AI Tersedia
                </h3>
                <Badge
                  variant="secondary"
                  className="ml-auto bg-[#ffe088]/40 text-[#4a2c20] dark:bg-[#2c1810]/50 dark:text-[#ffe088] border-0 text-xs"
                >
                  {AI_FEATURES.filter((f) => f.enabled).length}/{AI_FEATURES.length} Aktif
                </Badge>
              </div>

              <div className="space-y-1 max-h-[360px] overflow-y-auto pr-1">
                {AI_FEATURES.map((feature, i) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.04, duration: 0.25 }}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                      feature.enabled
                        ? 'hover:bg-muted/50'
                        : 'opacity-40'
                    }`}
                  >
                    <div
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        feature.enabled
                          ? 'bg-[#ffe088]/40 dark:bg-[#2c1810]/40'
                          : 'bg-muted'
                      }`}
                    >
                      {feature.enabled ? (
                        <Check className="h-3.5 w-3.5 text-[#735c00] dark:text-[#e9c349]" />
                      ) : (
                        <feature.icon className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {feature.label}
                    </span>
                    {feature.enabled && (
                      <ChevronRight className="ml-auto h-3.5 w-3.5 text-muted-foreground/50" />
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ── AI Usage ────────────────────────────────────────────────── */}
        <motion.div variants={item}>
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ffe088]/40 dark:bg-[#2c1810]/40">
                  <BarChart3 className="h-4 w-4 text-[#735c00] dark:text-[#e9c349]" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">
                  Penggunaan AI
                </h3>
              </div>

              <div className="space-y-5">
                {/* Daily Quota */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">
                      Chat Hari Ini
                    </span>
                    <span
                      className={`text-sm font-semibold tabular-nums ${
                        isQuotaExceeded
                          ? 'text-red-600 dark:text-red-400'
                          : isQuotaLow
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-[#735c00] dark:text-[#e9c349]'
                      }`}
                    >
                      {MOCK_USAGE.chatToday}/{MOCK_USAGE.chatTodayLimit}
                    </span>
                  </div>
                  <div className="relative">
                    <Progress
                      value={usagePercent}
                      className={`h-2.5 rounded-full ${
                        isQuotaExceeded
                          ? '[&>div]:bg-red-500 [&>div]:shadow-red-500/30 [&>div]:shadow-sm'
                          : isQuotaLow
                            ? '[&>div]:bg-amber-500 [&>div]:shadow-amber-500/30 [&>div]:shadow-sm'
                            : '[&>div]:bg-[#735c00] [&>div]:shadow-[#735c00]/30 [&>div]:shadow-sm'
                      } [&>div]:rounded-full`}
                    />
                  </div>
                  {isQuotaLow && !isQuotaExceeded && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="h-3 w-3" />
                      Kuota hampir habis. Pertimbangkan untuk upgrade.
                    </p>
                  )}
                  {isQuotaExceeded && (
                    <p className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
                      <AlertTriangle className="h-3 w-3" />
                      Kuota harian telah habis. Upgrade untuk melanjutkan.
                    </p>
                  )}
                </div>

                <Separator />

                {/* Monthly Usage */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    Chat Bulan Ini
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="bg-[#ffe088]/40 text-[#4a2c20] dark:bg-[#2c1810]/50 dark:text-[#ffe088] border-0 text-xs font-medium"
                    >
                      Normal
                    </Badge>
                    <span className="text-sm font-semibold text-foreground tabular-nums">
                      {MOCK_USAGE.chatMonth}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Countdown & Reset */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Reset Kuota
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      00:00 WIB
                    </span>
                  </div>

                  <div className="flex items-center justify-between rounded-xl bg-muted/50 px-4 py-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">
                        Sisa waktu reset
                      </p>
                      <p className="text-lg font-bold tabular-nums tracking-wide text-foreground">
                        {countdown}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs"
                      onClick={handleResetQuota}
                      disabled={isResetting}
                    >
                      {isResetting ? (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                          Mereset...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                          Reset Kuota
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* ── Action Buttons ─────────────────────────────────────────────── */}
      <motion.div
        variants={item}
        className="flex flex-col sm:flex-row gap-3"
      >
        <Button
          variant="outline"
          className="rounded-2xl flex-1 h-11 text-sm font-medium"
          onClick={onBack}
        >
          <History className="mr-2 h-4 w-4" />
          Riwayat AI
          <ChevronRight className="ml-auto h-4 w-4" />
        </Button>

        <Button
          className="rounded-2xl flex-1 h-11 text-sm font-medium bg-gradient-to-r from-[#2c1810] to-teal-600 hover:from-[#2c1810] hover:to-teal-700 text-white shadow-lg shadow-[#735c00]/20 transition-all hover:shadow-xl hover:shadow-[#735c00]/30"
          onClick={() => setShowQuotaDialog(true)}
        >
          <Crown className="mr-2 h-4 w-4" />
          Upgrade AI
          <ChevronRight className="ml-auto h-4 w-4" />
        </Button>
      </motion.div>

      {/* ── Quota Exceeded Dialog ──────────────────────────────────────── */}
      <Dialog open={showQuotaDialog} onOpenChange={setShowQuotaDialog}>
        <DialogContent className="rounded-2xl sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2c1810] to-teal-500 shadow-lg shadow-[#735c00]/25">
              <Crown className="h-7 w-7 text-white" />
            </div>
            <DialogTitle className="text-center text-lg">
              Upgrade Paket AI
            </DialogTitle>
            <DialogDescription className="text-center">
              {isQuotaExceeded
                ? 'Kuota harian Anda telah habis. Upgrade ke paket yang lebih tinggi untuk melanjutkan menggunakan fitur AI tanpa batas.'
                : 'Dapatkan lebih banyak kuota dan fitur premium dengan upgrade paket AI Anda.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {/* Pro Plan Card */}
            <div className="rounded-xl border-2 border-[#735c00]/30 bg-[#ffe088]/50 dark:bg-[#2c1810]/20 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">
                  Pro Plan
                </span>
                <Badge className="bg-[#735c00] text-white border-0 text-xs">
                  Populer
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                Rp99K
                <span className="text-sm font-normal text-muted-foreground">
                  /bulan
                </span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-[#735c00]" /> 50 chat/hari
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-[#735c00]" /> Semua fitur AI
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-[#735c00]" /> Prioritas respons
                </span>
              </div>
            </div>

            {/* Enterprise Plan Card */}
            <div className="rounded-xl border border-border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-foreground">
                  Enterprise
                </span>
                <Badge variant="secondary" className="text-xs">
                  Unlimited
                </Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                Rp249K
                <span className="text-sm font-normal text-muted-foreground">
                  /bulan
                </span>
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-[#735c00]" /> Unlimited chat
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-[#735c00]" /> AI khusus
                </span>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3 text-[#735c00]" /> Support 24/7
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-col">
            <Button
              className="w-full rounded-xl bg-gradient-to-r from-[#2c1810] to-teal-600 hover:from-[#2c1810] hover:to-teal-700 text-white shadow-lg shadow-[#735c00]/20"
              onClick={() => setShowQuotaDialog(false)}
            >
              <Crown className="mr-2 h-4 w-4" />
              Upgrade Sekarang
            </Button>
            <Button
              variant="ghost"
              className="w-full rounded-xl"
              onClick={() => setShowQuotaDialog(false)}
            >
              Nanti Saja
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
