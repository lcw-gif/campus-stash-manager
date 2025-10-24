-- Update stock_items policies to allow viewers to see all data
CREATE POLICY "Viewers can view all stock items"
ON public.stock_items
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'viewer'));

-- Update stock_transactions policies to allow viewers to see all transactions
CREATE POLICY "Viewers can view all stock transactions"
ON public.stock_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'viewer'));

-- Update purchase_items policies to allow viewers to see all purchases
CREATE POLICY "Viewers can view all purchase items"
ON public.purchase_items
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'viewer'));

-- Update borrow_records policies to allow viewers to see all borrow records
CREATE POLICY "Viewers can view all borrow records"
ON public.borrow_records
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'viewer'));