-- Create stock_items table
CREATE TABLE public.stock_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  course_tag TEXT,
  purchase_price NUMERIC(10, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create purchase_items table
CREATE TABLE public.purchase_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  where_to_buy TEXT,
  price NUMERIC(10, 2),
  quantity INTEGER NOT NULL DEFAULT 1,
  link TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  course_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create stock_transactions table
CREATE TABLE public.stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  performed_by TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create borrow_records table
CREATE TABLE public.borrow_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.stock_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  borrower_name TEXT NOT NULL,
  borrower_contact TEXT NOT NULL,
  quantity_borrowed INTEGER NOT NULL,
  borrow_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  expected_return_date TIMESTAMPTZ,
  actual_return_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'borrowed',
  notes TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.stock_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stock_items
CREATE POLICY "Users can view their own stock items"
  ON public.stock_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stock items"
  ON public.stock_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stock items"
  ON public.stock_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stock items"
  ON public.stock_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for purchase_items
CREATE POLICY "Users can view their own purchase items"
  ON public.purchase_items FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchase items"
  ON public.purchase_items FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own purchase items"
  ON public.purchase_items FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own purchase items"
  ON public.purchase_items FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for stock_transactions
CREATE POLICY "Users can view their own transactions"
  ON public.stock_transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.stock_transactions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.stock_transactions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.stock_transactions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for borrow_records
CREATE POLICY "Users can view their own borrow records"
  ON public.borrow_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own borrow records"
  ON public.borrow_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own borrow records"
  ON public.borrow_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own borrow records"
  ON public.borrow_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_stock_items_updated_at
  BEFORE UPDATE ON public.stock_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_purchase_items_updated_at
  BEFORE UPDATE ON public.purchase_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();