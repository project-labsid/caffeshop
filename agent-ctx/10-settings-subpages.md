# Task 10 - 4 New Functional Settings Sub-Pages

## Summary
Created 4 new fully functional settings sub-page components for the Dkriuk POS app, replacing "Coming Soon" placeholders with real, working features.

## Files Created

### 1. PrinterSettings (`src/features/settings/PrinterSettings.tsx`)
- **Paper size**: Toggle between 58mm and 80mm thermal paper
- **Auto-print**: Toggle to auto-print receipts after transaction
- **Copies**: Select 1x, 2x, or 3x print copies
- **Receipt content toggles**: Show/hide logo, customer name, payment details
- **Custom header/footer text**: Editable text fields
- **Live receipt preview**: Real-time visual preview that updates as settings change
- **Test print button**: Simulates sending a test print
- **Reset to defaults**: One-click reset
- **Persistence**: Uses `/api/settings` (key-value store)

### 2. BackupSettings (`src/features/settings/BackupSettings.tsx`)
- **Database stats**: 8 colorful stat cards showing record counts (products, transactions, customers, etc.)
- **Export**: Downloads entire database as JSON file
- **Import**: File upload with module selection (all, products, categories, etc.) and strategy (merge/replace)
- **Danger zone**: Reset all data with confirmation dialog (preserves current user)
- **API route**: Created `/api/settings/backup/route.ts` for GET (export) and POST (import)

### 3. PaymentMethodSettings (`src/features/settings/PaymentMethodSettings.tsx`)
- **6 payment methods**: Cash, Debit, Credit, E-Wallet, QRIS, Bank Transfer
- **Enable/disable toggle** per method
- **Set default method** with star indicator
- **Reorder** methods with up/down buttons
- **Account info fields**: Bank account number/holder (Transfer) and QRIS merchant name
- **Visual icons & color coding** per method type
- **Persistence**: Uses `/api/settings` (JSON serialized)

### 4. HelpSettings (`src/features/settings/HelpSettings.tsx`)
- **App info card**: Logo, version, description
- **6 feature overview cards**: POS, Products, Reports, Multi-branch, Tax, Security
- **10-item FAQ accordion**: Common questions with detailed answers
- **12 keyboard shortcuts**: Organized by category (POS, Navigation, General) with styled kbd elements
- **Contact/support section**: Documentation and email support links

## Files Modified
- **`src/features/settings/SettingsPage.tsx`**: Added dynamic imports for 4 new components, added 'payment-methods' type and menu item, replaced ComingSoonPlaceholder with real components for printer/backup/help

## API Routes Created
- **`src/app/api/settings/backup/route.ts`**: GET exports all DB data as JSON, POST imports data with module/strategy options

## Patterns Used
- Override pattern (like NotificationSettings) to avoid setState-in-effect lint errors
- useMemo for derived state from server data
- useCallback for stable function references
- Consistent emerald color theme and card-based layout matching existing settings pages
- Framer Motion fadeIn animation
- Responsive grid layouts
- shadcn/ui components throughout
