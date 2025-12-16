-- Add Wallet Balance to Customers
-- This migration adds wallet functionality for customers

-- 1. Add wallet_balance column to customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL(10, 2) DEFAULT 0.00 CHECK (wallet_balance >= 0);

-- 2. Create wallet_transactions table to track wallet history
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit')),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  balance_before DECIMAL(10, 2) NOT NULL,
  balance_after DECIMAL(10, 2) NOT NULL,
  description TEXT,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_customer_id ON public.wallet_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_order_id ON public.wallet_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_created_at ON public.wallet_transactions(created_at DESC);

-- Enable RLS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wallet_transactions
DROP POLICY IF EXISTS "Customers can view their own transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.wallet_transactions;

CREATE POLICY "Customers can view their own transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.customers
    WHERE customers.id = wallet_transactions.customer_id
    AND customers.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all transactions"
ON public.wallet_transactions FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Function to add money to wallet
CREATE OR REPLACE FUNCTION public.add_to_wallet(
  _customer_id UUID,
  _amount DECIMAL(10, 2),
  _description TEXT DEFAULT 'Wallet top-up'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _transaction_id UUID;
  _current_balance DECIMAL(10, 2);
  _new_balance DECIMAL(10, 2);
BEGIN
  -- Get current balance
  SELECT wallet_balance INTO _current_balance
  FROM public.customers
  WHERE id = _customer_id;

  IF _current_balance IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  -- Calculate new balance
  _new_balance := _current_balance + _amount;

  -- Update customer wallet balance
  UPDATE public.customers
  SET wallet_balance = _new_balance,
      updated_at = NOW()
  WHERE id = _customer_id;

  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description
  )
  VALUES (
    _customer_id,
    'credit',
    _amount,
    _current_balance,
    _new_balance,
    _description
  )
  RETURNING id INTO _transaction_id;

  RETURN _transaction_id;
END;
$$;

-- Function to deduct from wallet
CREATE OR REPLACE FUNCTION public.deduct_from_wallet(
  _customer_id UUID,
  _amount DECIMAL(10, 2),
  _order_id UUID DEFAULT NULL,
  _description TEXT DEFAULT 'Order payment'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _transaction_id UUID;
  _current_balance DECIMAL(10, 2);
  _new_balance DECIMAL(10, 2);
BEGIN
  -- Get current balance
  SELECT wallet_balance INTO _current_balance
  FROM public.customers
  WHERE id = _customer_id;

  IF _current_balance IS NULL THEN
    RAISE EXCEPTION 'Customer not found';
  END IF;

  IF _current_balance < _amount THEN
    RAISE EXCEPTION 'Insufficient wallet balance';
  END IF;

  -- Calculate new balance
  _new_balance := _current_balance - _amount;

  -- Update customer wallet balance
  UPDATE public.customers
  SET wallet_balance = _new_balance,
      updated_at = NOW()
  WHERE id = _customer_id;

  -- Create transaction record
  INSERT INTO public.wallet_transactions (
    customer_id,
    transaction_type,
    amount,
    balance_before,
    balance_after,
    description,
    order_id
  )
  VALUES (
    _customer_id,
    'debit',
    _amount,
    _current_balance,
    _new_balance,
    _description,
    _order_id
  )
  RETURNING id INTO _transaction_id;

  RETURN _transaction_id;
END;
$$;

