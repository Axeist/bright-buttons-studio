-- Step 1: Add 'customer' to app_role enum
-- This must be in a separate migration because PostgreSQL requires enum values
-- to be committed before they can be used in the same transaction

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'customer';

