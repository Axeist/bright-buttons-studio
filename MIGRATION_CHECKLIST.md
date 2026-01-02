# Migration Checklist for Offline Customer Feature

## Required Migrations

Make sure all these migrations have been run in your Supabase database:

### 1. Add signup_source Column (REQUIRED - This was missing!)
**File:** `supabase/migrations/20251218000000_add_signup_source_to_customers.sql`

**What it does:**
- Adds `signup_source` column to `customers` table
- Allows values: 'online' or 'offline'
- Defaults to 'online'
- Creates index for performance
- Updates existing customers to 'online'

**To run:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20251218000000_add_signup_source_to_customers.sql`
3. Paste and run it

### 2. Customer Auth Migration
**File:** `supabase/migrations/20251206000013_migrate_customers_to_supabase_auth.sql`

**What it does:**
- Adds `user_id` column to link customers with auth.users
- Creates trigger for automatic customer creation on signup
- Sets `signup_source: 'online'` for website signups

### 3. Offline Customer Auth Function
**File:** `supabase/migrations/20251220000000_offline_customer_auth.sql`

**What it does:**
- Creates function placeholder for offline customer email handling

## Quick Fix - Run This SQL

If you're getting the error "Could not find the 'signup_source' column", run this in Supabase SQL Editor:

```sql
-- Add signup_source field to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS signup_source TEXT CHECK (signup_source IN ('online', 'offline')) DEFAULT 'online';

-- Create index for signup_source
CREATE INDEX IF NOT EXISTS idx_customers_signup_source ON public.customers(signup_source);

-- Update existing customers to be marked as 'online'
UPDATE public.customers 
SET signup_source = 'online' 
WHERE signup_source IS NULL;
```

## Verify Migration

After running the migration, verify it worked:

```sql
-- Check if column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'customers' 
  AND column_name = 'signup_source';

-- Check existing data
SELECT signup_source, COUNT(*) 
FROM customers 
GROUP BY signup_source;
```

## TypeScript Types

The TypeScript types have been updated in `src/integrations/supabase/types.ts` to include `signup_source`. 

**Note:** If you're using Supabase CLI, you may need to regenerate types:
```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

## After Running Migration

1. Restart your development server
2. Clear browser cache
3. Try creating a customer again

The error should be resolved!

