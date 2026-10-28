'use client';

/**
 * Halaman Form Produk (halaman terpisah, bukan modal).
 * Dipakai untuk Tambah Produk (productFormId = null)
 * maupun Edit Produk (productFormId = id produk).
 *
 * Navigasi ke halaman ini: useNavStore().openProductForm(productId?)
 * Kembali ke daftar    : setCurrentPage('products')
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Loader2,
  Package,
  ImagePlus,
  Trash2,
} from 'lucide-react';
import { cn, apiFetch } from '@/lib/utils';
import { processImageFile } from '@/lib/image-utils';
import { useNavStore } from '@/store';
import type { Category, Product } from '@/types';
import { RupiahInput } from '@/components/ui/rupiah-input';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

// ─── Form Schema ───────────────────────────────────────────────────────────────

const productFormSchema = z.object({
  name: z.string().min(2, 'Nama produk minimal 2 karakter'),
  barcode: z.string().optional().or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  categoryId: z.string().optional().or(z.literal('')),
  unit: z.string().min(1, 'Satuan wajib diisi').default('pcs'),
  costPrice: z.coerce.number().min(0, 'Harga modal tidak boleh negatif'),
  sellPrice: z.coerce.number().min(1, 'Harga jual harus lebih dari 0'),
  stock: z.coerce.number().int().min(0).default(0),
  minStock: z.coerce.number().int().min(0).default(5),
  image: z.string().optional().or(z.literal('')),
  isActive: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productFormSchema>;

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

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProductFormPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { productFormId, setCurrentPage } = useNavStore();

  const isEditMode = !!productFormId;
  const [photoUploading, setPhotoUploading] = useState(false);

  // ── Form ─────────────────────────────────────────────────────────────────
  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      barcode: '',
      sku: '',
      categoryId: '',
      unit: 'pcs',
      costPrice: 0,
      sellPrice: 0,
      stock: 0,
      minStock: 5,
      image: '',
      isActive: true,
    },
  });

  // ── Queries ──────────────────────────────────────────────────────────────
  const categoriesQuery = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch('/api/categories');
      if (!res.ok) throw new Error('Gagal memuat kategori');
      return res.json();
    },
  });
  const categories = categoriesQuery.data?.data ?? [];

  // Edit mode: ambil data produk dari server
  const productQuery = useQuery<Product | { data: Product }>({
    queryKey: ['product', productFormId],
    queryFn: async () => {
      const res = await apiFetch(`/api/products/${productFormId}`);
      if (!res.ok) throw new Error('Gagal memuat produk');
      return res.json();
    },
    enabled: isEditMode,
  });

  const fetchedProduct: Product | null = (() => {
    const raw = productQuery.data as Product | { data: Product } | undefined;
    if (!raw) return null;
    if ('data' in raw && raw.data) return raw.data as Product;
    return raw as Product;
  })();

  // Isi form sekali setelah data produk tersedia (mode edit)
  useEffect(() => {
    if (isEditMode && fetchedProduct && !form.formState.isSubmitSuccessful) {
      form.reset({
        name: fetchedProduct.name,
        barcode: fetchedProduct.barcode ?? '',
        sku: fetchedProduct.sku ?? '',
        categoryId: fetchedProduct.categoryId ?? '',
        unit: fetchedProduct.unit,
        costPrice: fetchedProduct.costPrice,
        sellPrice: fetchedProduct.sellPrice,
        stock: fetchedProduct.stock,
        minStock: fetchedProduct.minStock,
        image: fetchedProduct.image ?? '',
        isActive: fetchedProduct.isActive,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditMode, fetchedProduct?.id]);

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload: Record<string, unknown> = { ...data };
      if (!payload.barcode) delete payload.barcode;
      if (!payload.sku) delete payload.sku;
      if (!payload.categoryId) delete payload.categoryId;
      if (!payload.image) delete payload.image;
      const res = await apiFetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menambah produk');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Produk berhasil ditambahkan');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setCurrentPage('products');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      if (!productFormId) return;
      const payload: Record<string, unknown> = { ...data };
      if (!payload.barcode) payload.barcode = null;
      if (!payload.sku) payload.sku = null;
      if (!payload.categoryId) payload.categoryId = null;
      if (!payload.image) payload.image = null;
      const res = await apiFetch(`/api/products/${productFormId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengupdate produk');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Produk berhasil diperbarui');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', productFormId] });
      setCurrentPage('products');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const onSubmitForm = useCallback(
    (data: ProductFormData) => {
      if (isEditMode) {
        updateMutation.mutate(data);
      } else {
        createMutation.mutate(data);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isEditMode, productFormId]
  );

  const handleBack = () => setCurrentPage('products');

  const handlePickPhoto = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoUploading(true);
    try {
      const dataUrl = await processImageFile(file);
      form.setValue('image', dataUrl, { shouldDirty: true });
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Gagal memuat foto'
      );
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  // ── Loading state (mode edit) ────────────────────────────────────────────
  if (isEditMode && productQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-24"
    >
      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={handleBack}
            aria-label="Kembali ke daftar produk"
            className="shrink-0"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEditMode ? 'Edit Produk' : 'Tambah Produk'}
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isEditMode
                ? `Ubah detail produk ${fetchedProduct?.name ?? ''}`
                : 'Isi detail produk yang akan ditambahkan ke toko'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── Form Card ─────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmitForm)}
                className="space-y-5"
              >
                {/* Nama Produk */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Produk *</FormLabel>
                      <FormControl>
                        <Input placeholder="Masukkan nama produk" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="barcode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Barcode</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Scan atau ketik barcode"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sku"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>SKU</FormLabel>
                        <FormControl>
                          <Input placeholder="Kode SKU produk" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Kategori */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? ''}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Satuan */}
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Satuan</FormLabel>
                        <FormControl>
                          <Input placeholder="pcs" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Foto Produk — upload dari perangkat */}
                  <FormField
                    control={form.control}
                    name="image"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Foto Produk</FormLabel>
                        <FormControl>
                          <div className="flex items-start gap-3">
                            {/* Preview foto */}
                            <div className="size-20 rounded-lg border-2 border-dashed border-warm-border bg-muted/40 flex items-center justify-center overflow-hidden shrink-0">
                              {photoUploading ? (
                                <Loader2 className="size-6 animate-spin text-muted-foreground" />
                              ) : field.value ? (
                                <img
                                  src={field.value}
                                  alt="Preview foto produk"
                                  className="size-full object-cover"
                                />
                              ) : (
                                <ImagePlus className="size-6 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                aria-label="Pilih foto dari perangkat"
                                onChange={handlePhotoChange}
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handlePickPhoto}
                                disabled={photoUploading}
                              >
                                <ImagePlus className="size-4" />
                                Pilih dari Galeri
                              </Button>
                              {field.value && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-destructive hover:text-destructive h-7"
                                  onClick={() =>
                                    field.onChange('')
                                  }
                                >
                                  <Trash2 className="size-3.5" />
                                  Hapus Foto
                                </Button>
                              )}
                              <p className="text-xs text-muted-foreground">
                                JPG/PNG, otomatis diperkecil menjadi maks 512px
                              </p>
                            </div>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="costPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Modal *</FormLabel>
                        <FormControl>
                          <RupiahInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sellPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Jual *</FormLabel>
                        <FormControl>
                          <RupiahInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="stock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stok</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="0"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="minStock"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Minimum Stok</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="5"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Status Aktif</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Produk aktif akan muncul di kasir
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* ── Action Buttons ─────────────────────────────────────── */}
                <div
                  className={cn(
                    'flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t'
                  )}
                >
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    disabled={isMutating}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={isMutating}
                    className="bg-primary hover:bg-[#4a2c20]"
                  >
                    {isMutating ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : isEditMode ? (
                      'Perbarui Produk'
                    ) : (
                      <>
                        <Package className="size-4" />
                        Simpan Produk
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
