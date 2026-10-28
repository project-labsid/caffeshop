'use client';

import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { createOrGetQueryClient } from '@/lib/query-client';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Client disimpan sebagai singleton di lib/query-client supaya
  // store auth (login/logout) bisa membersihkan cache saat ganti akun.
  const [queryClient] = useState(() => createOrGetQueryClient());

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
