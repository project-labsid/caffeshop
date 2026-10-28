import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { UserRole } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── Role Normalization ───────────────────────────────────────────────────────

/** Alias role lama / variasi penulisan → role standar aplikasi */
const ROLE_ALIASES: Record<string, UserRole> = {
  super_admin: 'super_admin',
  superadmin: 'super_admin',
  owner: 'owner',
  pemilik: 'owner',
  admin: 'admin',
  cashier: 'cashier',
  cashir: 'cashier', // typo lama
  kasir: 'cashier',
};

/**
 * Menormalkan role apa pun (mis. "Owner", "CASHIER", "cashir") menjadi
 * role standar: super_admin | admin | cashier | owner.
 * Role yang tidak dikenal dikembalikan apa adanya (huruf kecil) sehingga
 * tetap gagal di pengecekan izin (fail-closed).
 */
export function normalizeRole(role?: string | null): UserRole {
  if (!role) return 'cashier';
  const key = String(role).toLowerCase().trim();
  return ROLE_ALIASES[key] ?? (key as UserRole);
}

/** Label role yang rapi untuk ditampilkan di UI */
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Super Admin',
  owner: 'Owner',
  admin: 'Admin',
  cashier: 'Kasir',
};

// ─── Rupiah Formatting ─────────────────────────────────────────────────────────

/** Format angka ke Rp 10.000 (pakai titik sebagai pemisah ribuan) */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format raw digit string ke string dengan titik: "10000" → "10.000" */
export function formatNominal(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Parse string berformat titik kembali ke angka: "10.000" → 10000 */
export function parseNominal(formatted: string): number {
  return parseInt(formatted.replace(/\D/g, ''), 10) || 0;
}

// ─── Account-scoped API fetch ────────────────────────────────────────────────

/**
 * Wrapper around fetch() that automatically injects x-account-id and x-user-role headers
 * from the current authenticated user stored in localStorage.
 * All API calls should use this instead of raw fetch() to ensure data isolation between accounts.
 */
export function apiFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const headers = new Headers(init?.headers);

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('pos_user');
      if (stored) {
        const user = JSON.parse(stored);
        if (user.accountId) {
          headers.set('x-account-id', user.accountId);
        }
        if (user.role) {
          headers.set('x-user-role', user.role);
        }
        if (user.id) {
          headers.set('x-user-id', user.id);
        }
      }
    } catch {
      // ignore
    }
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
