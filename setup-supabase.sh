#!/bin/bash
# ============================================================
# Kasir Kopi Shop - Supabase Database Setup Script
# ============================================================
# 
# CARA 1: Local Development (Supabase lokal di komputer)
#   ./setup-supabase.sh local
#
# CARA 2: Link ke project Supabase cloud yang sudah ada
#   ./setup-supabase.sh link
#
# CARA 3: Push migration ke Supabase cloud
#   ./setup-supabase.sh push
#
# CARA 4: Seed data
#   ./setup-supabase.sh seed
#
# CARA 5: Reset database (HATI-HATI: hapus semua data!)
#   ./setup-supabase.sh reset
#
# ============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MIGRATIONS_DIR="$SCRIPT_DIR/supabase/migrations"
SEED_FILE="$SCRIPT_DIR/supabase/seed.sql"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BLUE}  ☕ Kasir Kopi Shop - Supabase Setup${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

print_step() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================
# LOCAL: Start Supabase locally
# ============================================================
setup_local() {
  print_header
  echo -e "${YELLOW}🔧 Starting Supabase locally...${NC}"
  echo ""
  
  # Start Supabase local
  supabase start
  
  echo ""
  print_step "Supabase local is running!"
  echo ""
  supabase status
  echo ""
  print_info "API URL: http://localhost:54321"
  print_info "DB URL:  postgresql://postgres:postgres@localhost:54322/postgres"
  print_info "Studio:  http://localhost:54323"
  echo ""
  
  # Apply migrations
  echo -e "${YELLOW}📦 Applying migrations...${NC}"
  supabase db push
  
  print_step "Migrations applied!"
  echo ""
  
  # Seed
  echo -e "${YELLOW}🌱 Seeding data...${NC}"
  supabase db seed
  
  print_step "Data seeded!"
  echo ""
  print_step "Setup complete! Buka http://localhost:54323 untuk Supabase Studio"
}

# ============================================================
# LINK: Link to existing Supabase cloud project
# ============================================================
setup_link() {
  print_header
  echo -e "${YELLOW}🔗 Linking to Supabase cloud project...${NC}"
  echo ""
  echo -e "${BLUE}Pastikan Anda sudah:${NC}"
  echo "  1. Buat project di https://supabase.com/dashboard"
  echo "  2. Login: supabase login"
  echo ""
  
  # Login check
  supabase login
  
  echo ""
  echo -e "${YELLOW}Masukkan Project Reference ID dari dashboard Supabase:${NC}"
  echo "  (Ditemukan di Settings > General > Reference ID)"
  echo ""
  read -p "Project Ref ID: " PROJECT_REF
  
  if [ -z "$PROJECT_REF" ]; then
    print_error "Project Ref ID tidak boleh kosong!"
    exit 1
  fi
  
  supabase link --project-ref "$PROJECT_REF"
  
  print_step "Linked to project: $PROJECT_REF"
  echo ""
  print_info "Sekarang jalankan: ./setup-supabase.sh push"
}

# ============================================================
# PUSH: Push migrations to cloud
# ============================================================
setup_push() {
  print_header
  echo -e "${YELLOW}🚀 Pushing migrations to Supabase cloud...${NC}"
  echo ""
  
  print_warn "Ini akan membuat tabel di database cloud Supabase Anda!"
  read -p "Lanjutkan? (y/N): " CONFIRM
  
  if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "Dibatalkan."
    exit 0
  fi
  
  echo ""
  
  # Push the schema
  supabase db push
  
  print_step "Migrations pushed successfully!"
  echo ""
  
  # Ask to seed
  echo -e "${YELLOW}Seed data sekarang? (y/N): ${NC}"
  read -p "> " SEED_CONFIRM
  
  if [ "$SEED_CONFIRM" = "y" ] || [ "$SEED_CONFIRM" = "Y" ]; then
    setup_seed
  fi
}

# ============================================================
# SEED: Insert seed data
# ============================================================
setup_seed() {
  print_header
  echo -e "${YELLOW}🌱 Seeding database...${NC}"
  echo ""
  
  supabase db seed
  
  print_step "Data seeded successfully!"
  echo ""
  print_info "Default login: admin@kasirkopishop.com / admin123"
}

# ============================================================
# RESET: Reset entire database
# ============================================================
setup_reset() {
  print_header
  echo -e "${RED}⚠️  RESET DATABASE - SEMUA DATA AKAN DIHAPUS!${NC}"
  echo ""
  read -p "Ketik 'RESET' untuk konfirmasi: " CONFIRM
  
  if [ "$CONFIRM" != "RESET" ]; then
    echo "Dibatalkan."
    exit 0
  fi
  
  supabase db reset
  
  print_step "Database reset complete!"
}

# ============================================================
# STATUS: Show current status
# ============================================================
setup_status() {
  print_header
  supabase status
}

# ============================================================
# GENERATE: Generate bcrypt password hash
# ============================================================
setup_hash() {
  print_header
  echo -e "${YELLOW}🔑 Generate bcrypt password hash${NC}"
  echo ""
  read -p "Password: " PASSWORD
  
  if [ -z "$PASSWORD" ]; then
    print_error "Password tidak boleh kosong!"
    exit 1
  fi
  
  HASH=$(node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('$PASSWORD', 10));")
  echo ""
  echo -e "${GREEN}Hash: $HASH${NC}"
  echo ""
  print_info "Gunakan hash ini di seed.sql untuk password user"
}

# ============================================================
# Main
# ============================================================
case "${1:-}" in
  local)
    setup_local
    ;;
  link)
    setup_link
    ;;
  push)
    setup_push
    ;;
  seed)
    setup_seed
    ;;
  reset)
    setup_reset
    ;;
  status)
    setup_status
    ;;
  hash)
    setup_hash
    ;;
  *)
    print_header
    echo "Usage: ./setup-supabase.sh <command>"
    echo ""
    echo "Commands:"
    echo "  local   - Start Supabase lokal + apply migrations + seed"
    echo "  link    - Link ke project Supabase cloud"
    echo "  push    - Push migrations ke cloud"
    echo "  seed    - Insert seed data"
    echo "  reset   - Reset database (HAPUS SEMUA DATA!)"
    echo "  status  - Lihat status Supabase"
    echo "  hash    - Generate bcrypt password hash"
    echo ""
    echo "Langkah-langkah untuk cloud:"
    echo "  1. ./setup-supabase.sh link"
    echo "  2. ./setup-supabase.sh push"
    echo "  3. ./setup-supabase.sh seed"
    ;;
esac
