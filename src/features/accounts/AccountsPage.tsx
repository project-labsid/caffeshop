'use client';

import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Building2,
  Users,
  Package,
  Receipt,
  GitBranch,
  ChevronDown,
  ChevronUp,
  Mail,
  Shield,
  UserCheck,
  UserX,
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { apiFetch, cn } from '@/lib/utils';

interface AccountUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AccountData {
  id: string;
  name: string;
  slug: string;
  ownerEmail: string;
  isActive: boolean;
  createdAt: string;
  users: AccountUser[];
  _count: {
    users: number;
    products: number;
    transactions: number;
    branches: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

function getRoleBadge(role: string) {
  switch (role) {
    case 'owner':
      return <Badge className="bg-[#ffe088]/40 text-[#735c00] border-[#e9c349]/40">Owner</Badge>;
    case 'admin':
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Admin</Badge>;
    case 'cashir':
    case 'cashier':
      return <Badge className="bg-green-100 text-green-700 border-green-200">Kasir</Badge>;
    case 'super_admin':
      return <Badge className="bg-purple-100 text-purple-700 border-purple-200">Super Admin</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
}

export default function AccountsPage() {
  const [expandedAccount, setExpandedAccount] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery<AccountData[]>({
    queryKey: ['accounts'],
    queryFn: async () => {
      const res = await apiFetch('/api/accounts');
      if (!res.ok) throw new Error('Gagal memuat data akun');
      const json = await res.json();
      return json.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 p-1">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const accountList = accounts ?? [];
  const totalUsers = accountList.reduce((sum, a) => sum + a._count.users, 0);
  const totalProducts = accountList.reduce((sum, a) => sum + a._count.products, 0);
  const totalTransactions = accountList.reduce((sum, a) => sum + a._count.transactions, 0);

  return (
    <motion.div
      className="space-y-6 p-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold tracking-tight">Semua Akun</h1>
        <p className="text-muted-foreground mt-1">
          Daftar semua coffee shop yang menggunakan aplikasi ini
        </p>
      </motion.div>

      {/* Summary Stats */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ffe088]/40">
              <Building2 className="h-5 w-5 text-[#735c00]" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Toko</p>
              <p className="text-lg font-bold">{accountList.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Pengguna</p>
              <p className="text-lg font-bold">{totalUsers}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100">
              <Package className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Produk</p>
              <p className="text-lg font-bold">{totalProducts}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-100">
              <Receipt className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Transaksi</p>
              <p className="text-lg font-bold">{totalTransactions}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Account Cards */}
      <div className="space-y-4">
        {accountList.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-lg font-medium">Belum ada akun terdaftar</p>
          </Card>
        ) : (
          accountList.map((account) => {
            const isExpanded = expandedAccount === account.id;
            return (
              <motion.div key={account.id} variants={itemVariants}>
                <Card className="overflow-hidden">
                  <button
                    className="w-full text-left"
                    onClick={() => setExpandedAccount(isExpanded ? null : account.id)}
                  >
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#ffe088]/40">
                              <Building2 className="h-5 w-5 text-[#735c00]" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold truncate">{account.name}</h3>
                              <p className="text-xs text-muted-foreground">{account.ownerEmail}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{account._count.users}</span>
                            <span className="flex items-center gap-1"><Package className="h-3.5 w-3.5" />{account._count.products}</span>
                            <span className="flex items-center gap-1"><Receipt className="h-3.5 w-3.5" />{account._count.transactions}</span>
                          </div>
                          {account.isActive ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Aktif</Badge>
                          ) : (
                            <Badge className="bg-red-100 text-red-700 border-red-200">Nonaktif</Badge>
                          )}
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>
                    </CardContent>
                  </button>

                  {isExpanded && (
                    <div className="border-t bg-muted/30">
                      <div className="p-5 space-y-4">
                        {/* Account Details */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Pengguna</p>
                            <p className="font-medium">{account._count.users}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Produk</p>
                            <p className="font-medium">{account._count.products}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Transaksi</p>
                            <p className="font-medium">{account._count.transactions}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Cabang</p>
                            <p className="font-medium">{account._count.branches}</p>
                          </div>
                        </div>

                        <Separator />

                        {/* Users List */}
                        <div>
                          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <Users className="h-4 w-4" /> Pengguna di akun ini
                          </p>
                          {account.users.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Belum ada pengguna</p>
                          ) : (
                            <ScrollArea className="max-h-64">
                              <div className="space-y-2">
                                {account.users.map((u) => (
                                  <div
                                    key={u.id}
                                    className="flex items-center justify-between rounded-lg border bg-background px-3 py-2"
                                  >
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                                        {u.isActive ? (
                                          <UserCheck className="h-4 w-4 text-primary" />
                                        ) : (
                                          <UserX className="h-4 w-4 text-muted-foreground" />
                                        )}
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{u.name}</p>
                                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                                          <Mail className="h-3 w-3" /> {u.email}
                                        </p>
                                      </div>
                                    </div>
                                    <div className="shrink-0 ml-3">
                                      {getRoleBadge(u.role)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
