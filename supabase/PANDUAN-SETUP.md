# ☕ Kasir Kopi Shop - Panduan Setup Database Supabase

## 📋 Daftar Isi

1. [Opsi A: Via Supabase Dashboard (Termudah)](#opsi-a-via-supabase-dashboard)
2. [Opsi B: Via Supabase CLI](#opsi-b-via-supabase-cli)
3. [Opsi C: Via Script Otomatis](#opsi-c-via-script-otomatis)
4. [Konfigurasi Environment](#konfigurasi-environment)
5. [Verifikasi Database](#verifikasi-database)

---

## Opsi A: Via Supabase Dashboard (Termudah)

### Langkah 1: Buat Project Supabase

1. Buka **https://supabase.com/dashboard**
2. Klik **"New Project"**
3. Isi:
   - **Name**: `kasir-kopi-shop`
   - **Database Password**: (buat password kuat, simpan!)
   - **Region**: pilih terdekat (Singapore / Tokyo)
4. Klik **"Create new project"**
5. Tunggu sampai project selesai dibuat (~2 menit)

### Langkah 2: Jalankan Migration SQL

1. Di dashboard, buka **SQL Editor** (menu kiri)
2. Jalankan SETIAP file secara berurutan:

| Urutan | File | Keterangan |
|--------|------|------------|
| 1️⃣ | `00001_initial_schema.sql` | Buat 21 tabel |
| 2️⃣ | `00002_rls_policies.sql` | Aktifkan RLS & policies |
| 3️⃣ | `00003_indexes.sql` | Buat index performa |
| 4️⃣ | `00004_functions.sql` | Buat functions & views |
| 5️⃣ | `00005_auth_hook.sql` | Set JWT custom claims |
| 6️⃣ | `00006_realtime.sql` | Aktifkan realtime |

**Cara menjalankan:**
- Klik **"New query"**
- Copy-paste ISI file SQL
- Klik **"Run"** (atau Ctrl+Enter)
- Pastikan muncul "Success"
- Lanjut ke file berikutnya

### Langkah 3: Jalankan Seed Data

1. Di **SQL Editor**, klik **"New query"**
2. Copy-paste isi file `seed.sql`
3. Klik **"Run"**

### Langkah 4: Ambil Credentials

1. Buka **Settings** → **General**
2. Catat **Project URL** dan **Project API keys**
3. Simpan di `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

DATABASE_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.xxxxx:[PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres
```

---

## Opsi B: Via Supabase CLI

### Langkah 1: Install & Login

```bash
# Install Supabase CLI (sudah tersedia)
npx supabase --version

# Login ke Supabase
npx supabase login
```

### Langkah 2: Link ke Project Cloud

```bash
# Link ke project yang sudah dibuat di dashboard
npx supabase link --project-ref YOUR_PROJECT_REF
```

> Project Ref ada di **Settings → General → Reference ID**

### Langkah 3: Push Migration

```bash
# Push semua migration ke cloud
npx supabase db push
```

### Langkah 4: Seed Data

```bash
# Jalankan seed SQL
npx supabase db seed
```

---

## Opsi C: Via Script Otomatis

```bash
# Setup lengkap (link + push + seed)
./setup-supabase.sh link     # Link ke cloud project
./setup-supabase.sh push     # Push migration
./setup-supabase.sh seed     # Insert data awal

# Atau untuk development lokal
./setup-supabase.sh local    # Start Supabase lokal

# Cek status
./setup-supabase.sh status

# Generate password hash
./setup-supabase.sh hash
```

---

## Konfigurasi Environment

Tambahkan ke `.env.local` project Next.js Anda:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Prisma (untuk Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.your-ref:your-password@aws-0-region.pooler.supabase.com:6543/postgres
DIRECT_URL=postgresql://postgres.your-ref:your-password@aws-0-region.pooler.supabase.com:5432/postgres
```

### Cara mendapatkan Connection String:

1. Di Supabase Dashboard → **Settings** → **Database**
2. Scroll ke **Connection string** → pilih **URI** tab
3. Copy **Connection pooling** URL (port 6543) → ini `DATABASE_URL`
4. Copy **Direct connection** URL (port 5432) → ini `DIRECT_URL`
5. Ganti `[YOUR-PASSWORD]` dengan password database Anda

---

## Verifikasi Database

Setelah setup, verifikasi di **Supabase Dashboard**:

### 1. Cek Tabel
- Buka **Table Editor**
- Pastikan ada 21 tabel: account, user, branch, category, product, transaction, dll.

### 2. Cek Data
- Klik tabel **user** → harus ada 4 user
- Klik tabel **product** → harus ada 20 produk
- Klik tabel **category** → harus ada 5 kategori

### 3. Cek RLS
- Buka **Authentication** → **Policies**
- Pastikan setiap tabel punya RLS enabled dan policies

### 4. Test Login
```
Email: admin@kasirkopishop.com
Password: admin123
```

---

## 🔧 Ganti Prisma ke PostgreSQL

Jika ingin project ini langsung pakai Supabase:

```bash
# 1. Backup schema lama
cp prisma/schema.prisma prisma/schema.sqlite.bak

# 2. Copy schema Supabase
cp supabase/prisma-schema-supabase.prisma prisma/schema.prisma

# 3. Update .env dengan DATABASE_URL PostgreSQL

# 4. Generate Prisma Client
npx prisma generate

# 5. Push schema (opsional, karena migration sudah dijalankan via SQL)
npx prisma db push
```

---

## 📊 Tabel yang Dibuat

| # | Tabel | Fungsi |
|---|-------|--------|
| 1 | `account` | Multi-tenancy root |
| 2 | `branch` | Cabang toko |
| 3 | `user` | User & auth |
| 4 | `category` | Kategori produk |
| 5 | `product` | Produk (tanpa barcode/sku/unit) |
| 6 | `transaction` | Transaksi penjualan |
| 7 | `transaction_item` | Item transaksi |
| 8 | `purchase` | Pembelian/pengadaan |
| 9 | `purchase_item` | Item pembelian |
| 10 | `stock_adjustment` | Penyesuaian stok |
| 11 | `store_setting` | Pengaturan toko |
| 12 | `tax_setting` | Pajak |
| 13 | `service_charge_setting` | Service charge |
| 14 | `activity_log` | Log aktivitas |
| 15 | `subscription_plan` | Paket langganan |
| 16 | `subscription` | Langganan |
| 17 | `subscription_usage` | Usage langganan |
| 18 | `payment_method` | Metode bayar |
| 19 | `ai_usage` | Usage AI |
| 20 | `ai_chat_log` | Log chat AI |
| 21 | `ai_provider_config` | Config AI |

---

## 🔐 Login Default

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@kasirkopishop.com | admin123 |
| Admin | rina@kasirkopishop.com | admin123 |
| Cashier | budi@kasirkopishop.com | admin123 |
| Cashier | siti@kasirkopishop.com | admin123 |
