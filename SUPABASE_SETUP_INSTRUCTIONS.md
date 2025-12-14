# Supabase Dashboard Setup for Customer Authentication

## Required Steps in Supabase Dashboard

### 1. Enable pgcrypto Extension (CRITICAL)

The `pgcrypto` extension is required for password hashing. The migration tries to enable it automatically, but if it fails, you need to enable it manually:

**Steps:**
1. Go to your Supabase Dashboard
2. Navigate to **Database** → **Extensions**
3. Search for `pgcrypto`
4. Click the toggle to enable it (or click "Enable" if it's disabled)
5. Wait for it to be enabled (should be instant)

**Why this is needed:**
- The `gen_salt()` and `crypt()` functions come from the `pgcrypto` extension
- Without it, you'll get the "function gen_salt(unknown) does not exist" error

### 2. Verify Database Functions

After running the migration, verify the functions exist:

**Steps:**
1. Go to **Database** → **Functions**
2. You should see these functions:
   - `create_customer_auth`
   - `verify_customer_password`
   - `create_customer`
   - `delete_customer`
   - `get_customer_by_id`
   - `check_customer_exists`
   - `update_customer_password`
   - `reset_customer_password`
   - `generate_password_reset_token`
   - `verify_customer_email`

### 3. Verify RLS Policies

Check that Row Level Security policies are set up correctly:

**Steps:**
1. Go to **Database** → **Tables** → `customers`
2. Click on **Policies** tab
3. Verify you have:
   - "Public can insert customers for signup" (INSERT policy for all roles)

4. Go to **Database** → **Tables** → `customer_auth`
5. Click on **Policies** tab
6. Verify you have:
   - "Public can insert customer auth for new customers" (INSERT policy for public role)
   - "Admins can view all customer auth" (SELECT policy for authenticated admins)

### 4. No Changes Needed to Supabase Auth

**Important:** Your customer authentication system is **separate** from Supabase's built-in authentication:
- ✅ Customers use the custom `customer_auth` table
- ✅ Admin/staff users use Supabase Auth (`auth.users`)
- ✅ No changes needed to Authentication settings in Supabase Dashboard
- ✅ No email templates or auth providers need to be configured for customers

## Quick Verification

After applying the migration, test in Supabase SQL Editor:

```sql
-- Check if pgcrypto is enabled
SELECT * FROM pg_extension WHERE extname = 'pgcrypto';

-- Check if gen_salt function exists
SELECT proname FROM pg_proc WHERE proname = 'gen_salt';

-- Test the create_customer_auth function (should not error)
SELECT public.create_customer_auth(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'test@example.com',
  'testpassword123'
);
```

If the last query returns an error about gen_salt, the pgcrypto extension is not enabled.

## Troubleshooting

### If pgcrypto extension cannot be enabled via migration:

1. Go to Supabase Dashboard → Database → Extensions
2. Manually enable `pgcrypto`
3. Re-run the migration or just run the function creation parts

### If you get permission errors:

- All functions are created with `SECURITY DEFINER`, so they should work
- Make sure the functions have `GRANT EXECUTE` permissions (included in the migration)

### If signup still fails:

1. Check the browser console for the exact error
2. Check Supabase logs: Dashboard → Logs → Postgres Logs
3. Verify the migration ran successfully: Dashboard → Database → Migrations

