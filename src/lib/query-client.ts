import { QueryClient } from '@tanstack/react-query';

/**
 * Shared QueryClient singleton.
 *
 * Kenapa perlu: saat logout -> login dengan akun LAIN (tanpa reload halaman),
 * cache TanStack Query masih berisi data akun sebelumnya sehingga dashboard
 * dan halaman lain menampilkan data yang SALAH. Store auth memanggil
 * clearQueryCache() pada login/logout untuk memastikan semua data diambil
 * ulang untuk akun yang aktif.
 */

let sharedQueryClient: QueryClient | null = null;

export function createOrGetQueryClient(): QueryClient {
  if (!sharedQueryClient) {
    sharedQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 30 * 1000,
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });
  }
  return sharedQueryClient;
}

export function getQueryClient(): QueryClient | null {
  return sharedQueryClient;
}

/** Hapus seluruh cache query (dipanggil saat login/logout/ganti akun) */
export function clearQueryCache(): void {
  sharedQueryClient?.clear();
}
