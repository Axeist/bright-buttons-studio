# Supabase Authentication Implementation Checklist

## ✅ Completed Items

### Database & Migrations
- [x] Extended `app_role` enum to include `'customer'` (Migration: `20251206000012_migrate_customers_to_supabase_auth.sql`)
- [x] Linked `customers` table with `auth.users` via `user_id` column
- [x] Created trigger `handle_customer_signup()` for automatic customer creation
- [x] Updated RLS policies for customer data access
- [x] Created helper functions: `is_customer()` and `is_staff()`

### Hooks & Context
- [x] Updated `useAuth` to support `'customer'` role
- [x] Added `isStaff` and `isCustomer` boolean helpers to `useAuth`
- [x] Completely rewrote `useCustomerAuth` to use Supabase Auth
- [x] `useCustomerAuth` now fetches customer data from `customers` table using `user_id`

### Components
- [x] Created `CustomerProtectedRoute` component
- [x] Created `StaffProtectedRoute` component
- [x] Updated `ProtectedRoute` for backward compatibility
- [x] Fixed `Navbar` to properly detect customer role

### Pages
- [x] Updated `Login.tsx` to redirect based on role
- [x] Updated `CustomerLogin.tsx` to use Supabase Auth
- [x] Updated `App.tsx` routes to use new protected routes

### Routes
- [x] Customer routes use `CustomerProtectedRoute`
- [x] Staff routes use `StaffProtectedRoute`
- [x] Proper role-based redirects in place

## ⚠️ Items to Verify After Migration

### Type Generation
- [ ] Run `supabase gen types typescript` to update `types.ts` with `'customer'` in `app_role` enum
  - Current: `app_role: "admin" | "staff"`
  - Should be: `app_role: "admin" | "staff" | "customer"`

### Testing Required
- [ ] Test customer signup flow:
  - [ ] Sign up with email, password, name, phone
  - [ ] Verify email confirmation is sent
  - [ ] Verify customer record is created
  - [ ] Verify `'customer'` role is assigned
  - [ ] Verify profile is created

- [ ] Test customer sign-in:
  - [ ] Sign in with customer credentials
  - [ ] Verify redirect to `/customer/dashboard`
  - [ ] Verify customer data loads correctly
  - [ ] Verify customer can access customer routes
  - [ ] Verify customer cannot access staff routes

- [ ] Test staff sign-in:
  - [ ] Sign in with staff credentials
  - [ ] Verify redirect to `/dashboard`
  - [ ] Verify staff can access staff routes
  - [ ] Verify staff cannot access customer routes

- [ ] Test role separation:
  - [ ] Customer tries to access `/dashboard` → should redirect to `/customer/dashboard`
  - [ ] Staff tries to access `/customer/dashboard` → should redirect to `/dashboard`
  - [ ] Unauthenticated user tries to access protected route → should redirect to login

### Supabase Dashboard Configuration
- [ ] Verify `pgcrypto` extension is enabled (Database → Extensions)
- [ ] Verify email confirmation is enabled (Authentication → Settings)
- [ ] Verify email templates are configured (if custom templates needed)
- [ ] Test password reset flow

### Migration Execution
- [ ] Run migration `20251206000012_migrate_customers_to_supabase_auth.sql`
- [ ] Verify enum extension: `SELECT unnest(enum_range(NULL::app_role));` should show `admin`, `staff`, `customer`
- [ ] Verify trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'on_customer_auth_user_created';`
- [ ] Verify functions exist: `is_customer()`, `is_staff()`

### Data Migration (if needed)
- [ ] If existing customers in `customer_auth` table:
  - [ ] Create migration script to link existing customers to `auth.users`
  - [ ] Assign `'customer'` role to existing customers
  - [ ] Test with one existing customer first

## 🔍 Potential Issues to Watch For

1. **Email Confirmation**: Customers must confirm email before first sign-in (Supabase default)
   - Consider if you want to disable this for customers
   - Or provide clear messaging about email confirmation

2. **Phone Metadata**: Critical for distinguishing customer vs staff signups
   - Ensure `phone` is always included in customer signup metadata
   - Staff signups should NOT include phone

3. **TypeScript Types**: `types.ts` is auto-generated
   - Must run `supabase gen types` after migration
   - Or types will be out of sync

4. **Session Management**: Both customers and staff use same Supabase Auth session
   - Ensure proper role checking on every protected route
   - Consider session refresh handling

5. **Password Reset**: Now uses Supabase Auth's built-in flow
   - Verify redirect URLs are correct
   - Test the full password reset flow

## 📝 Notes

- The old `customer_auth` table is kept for backward compatibility but is no longer used
- All new customer signups will use Supabase Auth
- Staff authentication remains unchanged (already using Supabase Auth)
- RLS policies ensure customers can only access their own data

