'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Loader2,
  Package,
} from 'lucide-react';
import { cn, formatRupiah, apiFetch } from '@/lib/utils';
import { useNavStore } from '@/store';
import type { Product, Category, PaginatedResponse } from '@/types';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getStockColor(stock: number, minStock: number): string {
  if (stock <= minStock) return 'text-red-600 dark:text-red-400 font-semibold';
  if (stock <= minStock * 2) return 'text-amber-600 dark:text-amber-400 font-medium';
  return 'text-foreground';
}

function getStatusBadge(isActive: boolean) {
  if (isActive) {
    return (
      <Badge className="bg-[#ffe088]/40 text-[#4a2c20] border-[#e9c349]/40 hover:bg-[#ffe088]/40">
        Aktif
      </Badge>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
      Tidak Aktif
    </Badge>
  );
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const COLOR_PALETTE = [
  'bg-[#735c00]',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-teal-500',
  'bg-pink-500',
];

function getColorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

// ─── Animation Variants ──────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ─── Product Thumbnail ─────────────────────────────────────────────────────────

function ProductThumbnail({ name, image }: { name: string; image?: string }) {
  if (image) {
    return (
      <div className="size-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
        <img
          src={image}
          alt={name}
          className="size-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }
  const color = getColorForName(name);
  return (
    <div
      className={cn(
        'size-10 rounded-lg flex items-center justify-center flex-shrink-0',
        color
      )}
    >
      <span className="text-white text-xs font-bold">{getInitials(name)}</span>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProductsPage() {
  const queryClient = useQueryClient();
  /** Buka halaman form produk terpisah (null = Tambah, id = Edit) */
  const openProductForm = useNavStore((s) => s.openProductForm);

  // ── Filter State ────────────────────────────────────────────────────────────
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);

  // ── Dialog State (hanya untuk konfirmasi hapus) ───────────────────────────
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // ── Queries ────────────────────────────────────────────────────────────────

  const productsQuery = useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', page, perPage, search, categoryId, statusFilter, sorting],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        perPage: String(perPage),
      });
      if (search) params.set('search', search);
      if (categoryId) params.set('categoryId', categoryId);
      if (statusFilter) params.set('isActive', statusFilter);
      if (sorting.length > 0) {
        params.set('sortBy', sorting[0].id);
        params.set('sortOrder', sorting[0].desc ? 'desc' : 'asc');
      }
      const res = await apiFetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat produk');
      return res.json();
    },
  });

  const categoriesQuery = useQuery<{ data: Category[] }>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiFetch('/api/categories');
      if (!res.ok) throw new Error('Gagal memuat kategori');
      return res.json();
    },
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/products/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menghapus produk');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Produk berhasil dinonaktifkan');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeleteOpen(false);
      setDeletingProduct(null);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // ── Derived Data ────────────────────────────────────────────────────────────

  const categories = categoriesQuery.data?.data ?? [];
  const products = productsQuery.data?.data ?? [];
  const totalProducts = productsQuery.data?.total ?? 0;
  const totalPages = productsQuery.data?.totalPages ?? 1;
  const isLoading = productsQuery.isLoading || productsQuery.isFetching;

  const startItem = (page - 1) * perPage + 1;
  const endItem = Math.min(page * perPage, totalProducts);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const openDeleteDialog = useCallback((product: Product) => {
    setDeletingProduct(product);
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  }, [deletingProduct, deleteMutation]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      setPage(1);
    },
    []
  );

  const handleCategoryChange = useCallback(
    (value: string) => {
      setCategoryId(value === 'all' ? '' : value);
      setPage(1);
    },
    []
  );

  const handleStatusChange = useCallback(
    (value: string) => {
      setStatusFilter(value === 'all' ? '' : value);
      setPage(1);
    },
    []
  );

  const handlePerPageChange = useCallback((value: string) => {
    setPerPage(Number(value));
    setPage(1);
  }, []);

  // ── Table Columns ─────────────────────────────────────────────────────────

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      {
        accessorKey: 'index',
        header: 'No',
        size: 50,
        cell: ({ row }) => {
          const idx = row.index;
          return <span className="text-muted-foreground text-sm">{idx + 1}</span>;
        },
      },
      {
        accessorKey: 'image',
        header: 'Foto',
        size: 60,
        cell: ({ row }) => (
          <ProductThumbnail name={row.original.name} image={row.original.image} />
        ),
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nama
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : (
              <ChevronsUpDown className="ml-1 size-4 opacity-50" />
            )}
          </Button>
        ),
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate font-medium">
            {row.original.name}
          </div>
        ),
      },
      {
        accessorKey: 'barcode',
        header: 'Barcode',
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.barcode || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'sku',
        header: 'SKU',
        size: 100,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.sku || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'category',
        header: 'Kategori',
        size: 120,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-xs">
            {row.original.category?.name || '-'}
          </Badge>
        ),
      },
      {
        accessorKey: 'costPrice',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Harga Modal
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : (
              <ChevronsUpDown className="ml-1 size-4 opacity-50" />
            )}
          </Button>
        ),
        size: 130,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatRupiah(row.original.costPrice)}
          </span>
        ),
      },
      {
        accessorKey: 'sellPrice',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Harga Jual
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : (
              <ChevronsUpDown className="ml-1 size-4 opacity-50" />
            )}
          </Button>
        ),
        size: 130,
        cell: ({ row }) => (
          <span className="text-sm font-medium">
            {formatRupiah(row.original.sellPrice)}
          </span>
        ),
      },
      {
        accessorKey: 'stock',
        header: ({ column }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Stok
            {column.getIsSorted() === 'asc' ? (
              <ChevronUp className="ml-1 size-4" />
            ) : column.getIsSorted() === 'desc' ? (
              <ChevronDown className="ml-1 size-4" />
            ) : (
              <ChevronsUpDown className="ml-1 size-4 opacity-50" />
            )}
          </Button>
        ),
        size: 80,
        cell: ({ row }) => (
          <span
            className={cn(
              getStockColor(row.original.stock, row.original.minStock)
            )}
          >
            {row.original.stock} {row.original.unit}
          </span>
        ),
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        size: 100,
        cell: ({ row }) => getStatusBadge(row.original.isActive),
      },
      {
        id: 'actions',
        header: 'Aksi',
        size: 80,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <ChevronDown className="size-4" />
                <span className="sr-only">Aksi</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openProductForm(row.original.id)}>
                <Pencil className="size-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => openDeleteDialog(row.original)}
              >
                <Trash2 className="size-4" />
                <span>Hapus</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [openDeleteDialog]
  );

  // ── Table Instance ──────────────────────────────────────────────────────────

  const table = useReactTable({
    data: products,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  });

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produk</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola daftar produk toko Anda
          </p>
        </div>
        <Button
          onClick={() => openProductForm()}
          className="bg-primary hover:bg-[#4a2c20]"
        >
          <Plus className="size-4" />
          <span>Tambah Produk</span>
        </Button>
      </motion.div>

      {/* ── Filter / Search Bar ─────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama, barcode, atau SKU..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryId || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Semua Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Kategori</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[150px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="true">Aktif</SelectItem>
            <SelectItem value="false">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* ── Data Table ───────────────────────────────────────────────────────── */}
      <motion.div variants={itemVariants} className="rounded-xl border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: perPage }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-6" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-10 w-10 rounded-lg" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[150px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[80px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[60px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[80px] rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[90px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[90px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-[40px]" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-[70px] rounded-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8 rounded-md" />
                    </TableCell>
                  </TableRow>
                ))
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="size-10 text-muted-foreground/50" />
                      <p className="text-muted-foreground text-sm">
                        {search || categoryId || statusFilter
                          ? 'Tidak ada produk yang sesuai dengan filter'
                          : 'Belum ada produk. Klik "Tambah Produk" untuk memulai.'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Pagination ─────────────────────────────────────────────────────── */}
        {totalProducts > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <span>
                Menampilkan {startItem}-{endItem} dari {totalProducts}
              </span>
              <Select value={String(perPage)} onValueChange={handlePerPageChange}>
                <SelectTrigger className="w-[70px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span>per halaman</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft className="size-4" />
                <span className="sm:hidden">Sebelumnya</span>
              </Button>
              <div className="flex items-center gap-1 text-sm">
                <span className="px-2 py-1 rounded-md bg-primary text-primary-foreground font-medium">
                  {page}
                </span>
                <span className="text-muted-foreground">dari {totalPages}</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                <span className="sm:hidden">Berikutnya</span>
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ── Delete Confirmation Dialog ────────────────────────────────────────── */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Produk?</AlertDialogTitle>
            <AlertDialogDescription>
              Produk <span className="font-semibold">{deletingProduct?.name}</span>{' '}
              akan dinonaktifkan. Lanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 animate-spin" />
              )}
              {deleteMutation.isPending ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
