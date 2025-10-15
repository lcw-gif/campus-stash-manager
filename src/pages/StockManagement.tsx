import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StockItem, StockTransaction } from '@/types/stock';
import { Package, Plus, Minus, MapPin, Download, Upload, CheckCircle, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { stockItemSchema, stockTransactionSchema } from '@/lib/validationSchemas';
import { z } from 'zod';
import { exportToCsv, exportToJson, parseCSV, convertCsvToStockItems, readFileAsText } from '@/lib/fileUtils';
import { supabase } from '@/integrations/supabase/client';

export default function StockManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [transactionForm, setTransactionForm] = useState({
    type: 'in' as 'in' | 'out',
    quantity: '',
    reason: '',
    performedBy: '',
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [addItemForm, setAddItemForm] = useState({
    itemName: '',
    totalQuantity: '',
    location: '',
    courseTag: '',
    purchasePrice: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: items } = await supabase
        .from('stock_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      const { data: trans } = await supabase
        .from('stock_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      setStockItems(items?.map(item => ({
        id: item.id,
        itemName: item.item_name,
        totalQuantity: item.quantity,
        availableQuantity: item.quantity,
        location: item.location || '',
        courseTag: item.course_tag || '',
        purchasePrice: Number(item.purchase_price) || 0,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || []);

      setTransactions(trans?.map(t => ({
        id: t.id,
        stockItemId: t.item_id,
        type: t.type as 'in' | 'out',
        quantity: t.quantity,
        reason: t.reason,
        performedBy: t.performed_by,
        date: new Date(t.timestamp),
      })) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNewItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to add items",
          variant: "destructive",
        });
        return;
      }

      const validated = stockItemSchema.parse({
        itemName: addItemForm.itemName,
        totalQuantity: parseInt(addItemForm.totalQuantity) || 0,
        location: addItemForm.location,
        courseTag: addItemForm.courseTag,
        purchasePrice: parseFloat(addItemForm.purchasePrice) || 0,
      });

      const { data, error } = await supabase
        .from('stock_items')
        .insert({
          user_id: user.id,
          item_name: validated.itemName,
          quantity: validated.totalQuantity,
          location: validated.location,
          course_tag: validated.courseTag,
          purchase_price: validated.purchasePrice,
        })
        .select()
        .single();

      if (error) throw error;

      const newStockItem: StockItem = {
        id: data.id,
        itemName: data.item_name,
        totalQuantity: data.quantity,
        availableQuantity: data.quantity,
        location: data.location || '',
        courseTag: data.course_tag || '',
        purchasePrice: Number(data.purchase_price) || 0,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setStockItems([newStockItem, ...stockItems]);

      setAddItemForm({
        itemName: '',
        totalQuantity: '',
        location: '',
        courseTag: '',
        purchasePrice: '',
      });
      setShowAddForm(false);

      toast({
        title: "Success",
        description: "Stock item added successfully!",
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to add stock item",
          variant: "destructive",
        });
      }
    }
  };

  const handleTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem) {
      toast({
        title: "Error",
        description: "Please select a stock item.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      const validated = stockTransactionSchema.parse({
        quantity: parseInt(transactionForm.quantity) || 0,
        notes: transactionForm.reason,
      });

      if (!transactionForm.performedBy) {
        toast({
          title: "Error",
          description: "Please enter who performed the transaction.",
          variant: "destructive",
        });
        return;
      }

      const quantity = validated.quantity;
      const isStockOut = transactionForm.type === 'out';
    
      if (isStockOut && quantity > selectedItem.availableQuantity) {
        toast({
          title: "Error",
          description: "Cannot take out more items than available in stock.",
          variant: "destructive",
        });
        return;
      }

      const newQuantity = isStockOut 
        ? selectedItem.availableQuantity - quantity 
        : selectedItem.availableQuantity + quantity;

      const { error: updateError } = await supabase
        .from('stock_items')
        .update({ quantity: newQuantity })
        .eq('id', selectedItem.id);

      if (updateError) throw updateError;

      const { data: transData, error: transError } = await supabase
        .from('stock_transactions')
        .insert({
          user_id: user.id,
          item_id: selectedItem.id,
          item_name: selectedItem.itemName,
          type: transactionForm.type,
          quantity,
          reason: transactionForm.reason,
          performed_by: transactionForm.performedBy,
        })
        .select()
        .single();

      if (transError) throw transError;

      const newTransaction: StockTransaction = {
        id: transData.id,
        stockItemId: transData.item_id,
        type: transData.type as 'in' | 'out',
        quantity: transData.quantity,
        reason: transData.reason,
        performedBy: transData.performed_by,
        date: new Date(transData.timestamp),
      };

      setTransactions([newTransaction, ...transactions]);

      const updatedStockItems = stockItems.map(item => 
        item.id === selectedItem.id
          ? {
              ...item,
              availableQuantity: newQuantity,
              totalQuantity: transactionForm.type === 'in' 
                ? item.totalQuantity + quantity 
                : item.totalQuantity,
              updatedAt: new Date(),
            }
          : item
      );

      setStockItems(updatedStockItems);

      setTransactionForm({
        type: 'in',
        quantity: '',
        reason: '',
        performedBy: '',
      });
      setSelectedItem(null);

      toast({
        title: "Transaction Completed",
        description: `Stock ${transactionForm.type === 'in' ? 'added' : 'removed'} successfully.`,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to process transaction",
          variant: "destructive",
        });
      }
    }
  };

  const getStockStatus = (item: StockItem) => {
    if (item.availableQuantity === 0) return { status: 'Out of Stock', color: 'text-destructive' };
    if (item.availableQuantity < 5) return { status: 'Low Stock', color: 'text-warning' };
    return { status: 'In Stock', color: 'text-success' };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Stock Management</h1>
          <p className="text-muted-foreground">Manage your inventory and track stock movements</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Stock Item
        </Button>
      </div>

      {/* Add New Item Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Stock Item</CardTitle>
            <CardDescription>Add a new item directly to stock inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={addItemForm.itemName}
                    onChange={(e) => setAddItemForm({ ...addItemForm, itemName: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
                <div>
                  <Label htmlFor="totalQuantity">Total Quantity *</Label>
                  <Input
                    id="totalQuantity"
                    type="number"
                    value={addItemForm.totalQuantity}
                    onChange={(e) => setAddItemForm({ ...addItemForm, totalQuantity: e.target.value })}
                    placeholder="Enter quantity"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    value={addItemForm.location}
                    onChange={(e) => setAddItemForm({ ...addItemForm, location: e.target.value })}
                    placeholder="Storage location"
                  />
                </div>
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price *</Label>
                  <Input
                    id="purchasePrice"
                    type="number"
                    step="0.01"
                    value={addItemForm.purchasePrice}
                    onChange={(e) => setAddItemForm({ ...addItemForm, purchasePrice: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <Label htmlFor="courseTag">Course Tag</Label>
                  <Input
                    id="courseTag"
                    value={addItemForm.courseTag}
                    onChange={(e) => setAddItemForm({ ...addItemForm, courseTag: e.target.value })}
                    placeholder="e.g., Chemistry, Physics"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button type="submit">Add Item</Button>
                <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Stock Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Inventory</CardTitle>
          <CardDescription>Current stock levels and item details</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading stock items...</p>
            </div>
          ) : stockItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No stock items yet. Add items directly or mark purchase orders as "arrived".
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Available</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockItems.map((item) => {
                    const status = getStockStatus(item);
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.itemName}</p>
                            <p className="text-sm text-muted-foreground">
                              Purchase price: ${item.purchasePrice.toFixed(2)}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{item.availableQuantity}</TableCell>
                        <TableCell>{item.totalQuantity}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-1 text-muted-foreground" />
                            {item.location}
                          </div>
                        </TableCell>
                        <TableCell>{item.courseTag || '-'}</TableCell>
                        <TableCell>
                          <span className={status.color}>{status.status}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setTransactionForm(prev => ({ ...prev, type: 'in', quantity: '', reason: '', performedBy: '' }));
                                  }}
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Stock</DialogTitle>
                                  <DialogDescription>
                                    Add or deduct stock for {item.itemName}
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleTransaction} className="space-y-4">
                                  <div>
                                    <Label htmlFor="transactionType">Transaction Type</Label>
                                    <Select
                                      value={transactionForm.type}
                                      onValueChange={(value: 'in' | 'out') => 
                                        setTransactionForm({...transactionForm, type: value})
                                      }
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in">
                                          <div className="flex items-center">
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Stock
                                          </div>
                                        </SelectItem>
                                        <SelectItem value="out">
                                          <div className="flex items-center">
                                            <Minus className="w-4 h-4 mr-2" />
                                            Deduct Stock
                                          </div>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                      id="quantity"
                                      type="number"
                                      min="1"
                                      value={transactionForm.quantity}
                                      onChange={(e) => setTransactionForm({...transactionForm, quantity: e.target.value})}
                                      placeholder="Enter quantity"
                                    />
                                    {transactionForm.type === 'out' && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        Available: {item.availableQuantity}
                                      </p>
                                    )}
                                  </div>
                                  <div>
                                    <Label htmlFor="reason">Reason</Label>
                                    <Input
                                      id="reason"
                                      value={transactionForm.reason}
                                      onChange={(e) => setTransactionForm({...transactionForm, reason: e.target.value})}
                                      placeholder={transactionForm.type === 'in' ? 'e.g., New purchase, Return' : 'e.g., Damaged, Used, Lost'}
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="performedBy">Performed By</Label>
                                    <Input
                                      id="performedBy"
                                      value={transactionForm.performedBy}
                                      onChange={(e) => setTransactionForm({...transactionForm, performedBy: e.target.value})}
                                      placeholder="Your name"
                                    />
                                  </div>
                                  <Button type="submit" className="w-full">
                                    {transactionForm.type === 'in' ? 'Add to Stock' : 'Deduct from Stock'}
                                  </Button>
                                </form>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}