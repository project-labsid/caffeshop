'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Eye, EyeOff, Shield, Coffee, Store } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuthStore } from '@/store';

type LoginFormData = {
  email: string;
  password: string;
  remember: boolean;
};

type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  accountName: string;
  phone: string;
};

const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
  remember: z.boolean().optional().default(false),
});

const registerSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  confirmPassword: z.string().min(6, 'Konfirmasi password wajib diisi'),
  accountName: z.string().min(2, 'Nama toko minimal 2 karakter'),
  phone: z.string().optional().default(''),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Password tidak cocok',
  path: ['confirmPassword'],
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { login } = useAuthStore();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
    },
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      accountName: '',
      phone: '',
    },
  });

  useEffect(() => {
    async function checkSetup() {
      try {
        const res = await fetch('/api/users?perPage=1');
        if (res.ok) {
          const json = await res.json();
          if (json.total === 0) {
            setIsSetup(true);
            setShowRegister(true);
          }
        }
      } catch {
        // ignore
      }
    }
    checkSetup();
  }, []);

  async function onLogin(data: LoginFormData) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Login gagal, periksa email dan password');
        return;
      }

      if (data.remember) {
        localStorage.setItem('pos_remember', data.email);
      } else {
        localStorage.removeItem('pos_remember');
      }

      login(result.user);
      toast.success(`Selamat datang, ${result.user.name}!`);
    } catch {
      toast.error('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  async function onRegister(data: RegisterFormData) {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
          phone: data.phone,
          accountName: data.accountName,
          createAccount: true,
        }),
      });
      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Registrasi gagal');
        return;
      }

      // Auto-login after registration
      login(result.user);
      toast.success(`Selamat datang, ${result.user.name}! Akun "${data.accountName}" berhasil dibuat.`);
    } catch {
      toast.error('Terjadi kesalahan koneksi. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('pos_remember');
    if (saved) {
      loginForm.setValue('email', saved);
      loginForm.setValue('remember', true);
    }
  }, [loginForm]);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left branding area - desktop */}
      <motion.div
        initial={{ opacity: 0, x: -40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#2c1810] via-[#4a2c20] to-[#0e0b09]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(233,195,73,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.2),transparent_50%)]" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center text-center max-w-md"
          >
            <div className="w-20 h-20 bg-white/15 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/20 overflow-hidden">
              <img src="/logo.png" alt="Kasir Kopi Shop" className="w-full h-full object-cover" />
            </div>
            <h1 className="text-4xl xl:text-5xl font-bold tracking-tight mb-4 text-[#e9c349]">
              Kasir Kopi Shop
            </h1>
            <p className="text-[#e3bfb2] text-lg leading-relaxed">
              Sistem Kasir Coffee Shop modern untuk mengelola transaksi, stok, dan laporan bisnis kopi Anda dengan mudah dan efisien.
            </p>
            <div className="mt-12 grid grid-cols-3 gap-6 text-center">
              {[
                { label: 'Transaksi', value: 'Cepat' },
                { label: 'Stok', value: 'Terkelola' },
                { label: 'Laporan', value: 'Lengkap' },
              ].map((item) => (
                <div key={item.label}>
                  <div className="text-2xl font-bold text-[#e9c349]">{item.value}</div>
                  <div className="text-sm text-[#9e7e73] mt-1">{item.label}</div>
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </motion.div>

      {/* Mobile top gradient section */}
      <div className="lg:hidden relative h-48 bg-gradient-to-br from-[#2c1810] to-[#0e0b09] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(233,195,73,0.1),transparent_50%)]" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="relative z-10 flex flex-col items-center justify-center h-full text-white"
        >
          <div className="w-14 h-14 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center mb-3 border border-white/20 overflow-hidden">
            <img src="/logo.png" alt="Kasir Kopi Shop" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold text-[#e9c349]">Kasir Kopi Shop</h1>
          <p className="text-[#e3bfb2] text-sm mt-1">Coffee Shop POS</p>
        </motion.div>
      </div>

      {/* Right form area */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut', delay: 0.1 }}
        className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-12"
      >
        <div className="w-full max-w-md space-y-8">
          <AnimatePresence mode="wait">
            {!showRegister ? (
              <motion.div key="login" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-8">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Masuk ke Akun</h2>
                  <p className="text-muted-foreground mt-2">
                    Masukkan email dan password Anda untuk melanjutkan
                  </p>
                </div>

                {isSetup && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-[#ffe088]/30 dark:bg-[#2c1810]/50 border border-[#e9c349]/30 dark:border-[#e9c349]/30 rounded-lg"
                  >
                    <Shield className="w-5 h-5 text-[#735c00] dark:text-[#e9c349] shrink-0" />
                    <p className="text-sm text-[#735c00] dark:text-[#ffe088]">
                      Pertama kali menggunakan sistem? Silakan buat akun Coffee Shop terlebih dahulu.
                    </p>
                  </motion.div>
                )}

                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-5">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="nama@coffeeshop.com"
                              autoComplete="email"
                              disabled={isLoading}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <div className="relative">
                            <FormControl>
                              <Input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Masukkan password"
                                autoComplete="current-password"
                                disabled={isLoading}
                                className="pr-10"
                                {...field}
                              />
                            </FormControl>
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                              tabIndex={-1}
                            >
                              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={loginForm.control}
                      name="remember"
                      render={({ field }) => (
                        <FormItem className="flex items-center gap-2 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormLabel className="text-sm font-normal cursor-pointer select-none">
                            Ingat saya
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      className="w-full bg-[#2c1810] hover:bg-[#4a2c20] text-white h-11 text-base font-semibold shadow-warm-md"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Memproses...
                        </>
                      ) : (
                        'Masuk'
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setShowRegister(true)}
                    className="text-sm text-[#735c00] hover:text-[#2c1810] dark:text-[#e9c349] dark:hover:text-[#ffe088] font-medium transition-colors"
                  >
                    ☕ Buat Akun Coffee Shop Baru
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="register" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Buat Akun Baru</h2>
                  <p className="text-muted-foreground mt-2">
                    Buat akun Coffee Shop Anda untuk mulai menggunakan aplikasi.
                  </p>
                </div>

                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                    {/* Account Info Section */}
                    <div className="space-y-4 p-4 bg-[#ffe088]/20 dark:bg-[#2c1810]/30 border border-[#e9c349]/30 dark:border-[#e9c349]/30 rounded-xl">
                      <div className="flex items-center gap-2 text-[#735c00] dark:text-[#e9c349]">
                        <Store className="w-4 h-4" />
                        <span className="text-sm font-semibold">Informasi Coffee Shop</span>
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="accountName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Coffee Shop</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="contoh: Kopi Kenangan, Blue Bottle"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* User Info Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Coffee className="w-4 h-4" />
                        <span className="text-sm font-semibold">Informasi Pemilik</span>
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nama Lengkap</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nama Anda"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="nama@coffeeshop.com"
                                autoComplete="email"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>No. Telepon (opsional)</FormLabel>
                            <FormControl>
                              <Input
                                type="tel"
                                placeholder="08xxxxxxxxxx"
                                disabled={isLoading}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Min. 6 karakter"
                                  autoComplete="new-password"
                                  disabled={isLoading}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={registerForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Konfirmasi</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Ulangi password"
                                  autoComplete="new-password"
                                  disabled={isLoading}
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-[#2c1810] hover:bg-[#4a2c20] text-white h-11 text-base font-semibold shadow-warm-md"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Membuat akun...
                        </>
                      ) : (
                        '☕ Buat Akun Coffee Shop'
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => { setShowRegister(false); setIsSetup(false); }}
                    className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors"
                  >
                    Sudah punya akun? Masuk di sini
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
