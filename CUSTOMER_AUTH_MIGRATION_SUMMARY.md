# Customer Authentication Migration to Supabase Auth

## Overview

The customer authentication system has been migrated from a custom `customer_auth` table to use Supabase Auth, while maintaining clear separation between customer and staff portals.

## Key Changes

### 1. Database Changes

**Migration: `20251206000012_migrate_customers_to_supabase_auth.sql`**

- Extended `app_role` enum to include `'customer'`
- Linked `customers` table with `auth.users` via `user_id`
- Created trigger `handle_customer_signup()` that:
  - Automatically creates customer records on signup
  - Assigns `'customer'` role to new users
  - Only triggers when `phone` is present in signup metadata (distinguishes customers from staff)
- Updated RLS policies to allow customers to view/update their own data
- Created helper functions: `is_customer()` and `is_staff()`

### 2. Code Changes

#### Hooks

**`src/hooks/useAuth.tsx`**
- Extended `AppRole` type to include `'customer'`
- Added `isStaff` and `isCustomer` helpers
- Added `isStaff` and `isCustomer` boolean properties to context

**`src/hooks/useCustomerAuth.tsx`** (Complete Rewrite)
- Now uses Supabase Auth instead of custom authentication
- Fetches customer data from `customers` table using `user_id`
- Signup includes `phone` in metadata to trigger customer creation
- Sign-in validates that user has `'customer'` role

#### Components

**`src/components/ProtectedRoute.tsx`**
- Updated to handle role-based redirects
- Redirects customers to customer routes, staff to staff routes

**`src/components/CustomerProtectedRoute.tsx`** (New)
- Ensures only customers can access customer routes
- Redirects staff to staff dashboard

**`src/components/StaffProtectedRoute.tsx`** (New)
- Ensures only staff (admin/staff) can access staff routes
- Redirects customers to customer dashboard
- Supports `requireAdmin` prop for admin-only routes

#### Pages

**`src/pages/Login.tsx`**
- Updated to redirect based on role:
  - Customers → `/customer/dashboard`
  - Staff → `/dashboard`

**`src/pages/CustomerLogin.tsx`**
- Now uses Supabase Auth for sign-in/sign-up
- Validates customer role on sign-in
- Signup includes phone in metadata

**`src/App.tsx`**
- Updated routes to use `CustomerProtectedRoute` for customer pages
- Updated routes to use `StaffProtectedRoute` for staff pages

## How It Works

### Customer Signup Flow

1. User fills out signup form with email, password, name, and phone
2. `useCustomerAuth.signUp()` calls `supabase.auth.signUp()` with:
   - Email and password
   - Metadata: `{ full_name, phone }`
3. Supabase Auth creates user in `auth.users`
4. Trigger `handle_customer_signup()` fires (because `phone` is in metadata):
   - Creates record in `customers` table
   - Assigns `'customer'` role in `user_roles`
   - Creates profile entry
5. User receives email confirmation
6. After confirmation, user can sign in

### Customer Sign-In Flow

1. User enters email and password
2. `useCustomerAuth.signIn()` calls `supabase.auth.signInWithPassword()`
3. System validates user has `'customer'` role
4. If not customer, user is signed out and shown error
5. If customer, `useCustomerAuth` fetches customer data from `customers` table
6. User is redirected to `/customer/dashboard`

### Staff Signup Flow

1. Admin creates staff account via Staff management page
2. `supabase.auth.signUp()` is called without `phone` in metadata
3. Existing `handle_new_user()` trigger creates profile
4. Admin manually assigns `'admin'` or `'staff'` role
5. Staff can sign in at `/login`

### Role-Based Access Control

- **Customer Routes** (`/customer/*`):
  - Protected by `CustomerProtectedRoute`
  - Only accessible to users with `'customer'` role
  - Staff are redirected to `/dashboard`

- **Staff Routes** (`/dashboard`, `/pos`, `/products`, etc.):
  - Protected by `StaffProtectedRoute`
  - Only accessible to users with `'admin'` or `'staff'` role
  - Customers are redirected to `/customer/dashboard`

## Migration Steps

1. **Run the migration:**
   ```bash
   supabase db push
   ```
   Or apply `20251206000012_migrate_customers_to_supabase_auth.sql` in Supabase SQL Editor

2. **Migrate existing customers (if any):**
   - Existing customers using `customer_auth` table will need to:
     - Sign up again using the new system, OR
     - Manually link their `auth.users` record to their `customers` record
     - Assign `'customer'` role in `user_roles` table

3. **Test the flow:**
   - Create a new customer account
   - Verify customer can sign in
   - Verify customer can only access customer routes
   - Verify staff can only access staff routes

## Important Notes

1. **Email Confirmation**: Customers must confirm their email before they can sign in (Supabase Auth default behavior)

2. **Phone Metadata**: The `phone` field in signup metadata is critical - it's what distinguishes customer signups from staff signups

3. **Backward Compatibility**: The old `customer_auth` table and functions are kept for backward compatibility but are no longer used for new signups

4. **RLS Policies**: Customers can now view/update their own data via RLS policies, which is more secure than the previous approach

5. **Password Reset**: Now uses Supabase Auth's built-in password reset flow

## Supabase Dashboard Configuration

No additional configuration needed in Supabase Dashboard! The migration handles everything:
- ✅ Extends enum type
- ✅ Creates triggers
- ✅ Sets up RLS policies
- ✅ Creates helper functions

The only thing to verify is that email confirmation is enabled (default in Supabase).

## Troubleshooting

### Customer can't sign in after signup
- Check if email is confirmed
- Verify `'customer'` role was assigned in `user_roles` table
- Check if customer record was created in `customers` table

### Customer can access staff routes
- Verify `CustomerProtectedRoute` is used for customer routes
- Check that user has `'customer'` role, not `'admin'` or `'staff'`

### Staff can access customer routes
- Verify `StaffProtectedRoute` is used for staff routes
- Check that user has `'admin'` or `'staff'` role, not `'customer'`

### Signup doesn't create customer record
- Verify `phone` is included in signup metadata
- Check trigger `on_customer_auth_user_created` exists
- Check trigger function `handle_customer_signup()` exists

