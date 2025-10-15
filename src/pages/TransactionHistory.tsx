import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { RepurchaseButton } from "@/components/RepurchaseButton";
import { StockTransaction, StockItem, PurchaseItem } from "@/types/stock";
import { History, Edit, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { exportToCsv, exportToJson } from "@/lib/fileUtils";
import { supabase } from "@/integrations/supabase/client";

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTransaction, setEditingTransaction] = useState<StockTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'in' as 'in' | 'out',
    quantity: '',
    reason: '',
    performedBy: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: trans } = await supabase
        .from('stock_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false });

      const { data: items } = await supabase
        .from('stock_items')
        .select('*')
        .eq('user_id', user.id);

      const { data: purchases } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('user_id', user.id);

      setTransactions(trans?.map(t => ({
        id: t.id,
        stockItemId: t.item_id,
        type: t.type as 'in' | 'out',
        quantity: t.quantity,
        reason: t.reason,
        performedBy: t.performed_by,
        date: new Date(t.timestamp),
      })) || []);

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

      setPurchaseItems(purchases?.map(item => ({
        id: item.id,
        itemId: `ITEM-${item.id.substring(0, 8).toUpperCase()}`,
        itemName: item.item_name,
        whereToBuy: item.where_to_buy || '',
        price: Number(item.price) || 0,
        quantity: item.quantity,
        link: item.link,
        status: item.status as any,
        courseTag: item.course_tag,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getItemName = (stockItemId: string) => {
    const item = stockItems.find(item => item.id === stockItemId);
    return item?.itemName || 'Unknown Item';
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTransaction || !editForm.quantity || !editForm.reason || !editForm.performedBy) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('stock_transactions')
        .update({
          type: editForm.type,
          quantity: parseInt(editForm.quantity),
          reason: editForm.reason,
          performed_by: editForm.performedBy,
        })
        .eq('id', editingTransaction.id);

      if (error) throw error;

      const updatedTransactions = transactions.map(t =>
        t.id === editingTransaction.id
          ? {
              ...t,
              type: editForm.type,
              quantity: parseInt(editForm.quantity),
              reason: editForm.reason,
              performedBy: editForm.performedBy,
            }
          : t
      );

      setTransactions(updatedTransactions);
      setEditingTransaction(null);

      toast({
        title: "Transaction Updated",
        description: "Transaction details have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const startEdit = (transaction: StockTransaction) => {
    setEditingTransaction(transaction);
    setEditForm({
      type: transaction.type,
      quantity: transaction.quantity.toString(),
      reason: transaction.reason,
      performedBy: transaction.performedBy,
    });
  };

  const generateItemId = () => {
    return 'ITEM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 3).toUpperCase();
  };

  const handleRepurchase = async (originalItem: PurchaseItem, quantity: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('purchase_items')
        .insert({
          user_id: user.id,
          item_name: originalItem.itemName,
          where_to_buy: originalItem.whereToBuy,
          price: originalItem.price,
          quantity: quantity,
          link: originalItem.link,
          status: 'considering',
          course_tag: originalItem.courseTag,
        })
        .select()
        .single();

      if (error) throw error;

      const newItem: PurchaseItem = {
        id: data.id,
        itemId: `ITEM-${data.id.substring(0, 8).toUpperCase()}`,
        itemName: data.item_name,
        whereToBuy: data.where_to_buy || '',
        price: Number(data.price) || 0,
        quantity: data.quantity,
        link: data.link,
        status: data.status as any,
        courseTag: data.course_tag,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setPurchaseItems([newItem, ...purchaseItems]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create repurchase",
        variant: "destructive",
      });
    }
  };

  const getOriginalPurchaseItem = (stockItemId: string): PurchaseItem | null => {
    const stockItem = stockItems.find(item => item.id === stockItemId);
    if (!stockItem) return null;

    // Find the original purchase item by matching name and other details
    const originalItem = purchaseItems.find(item => 
      item.itemName === stockItem.itemName && 
      item.status === 'arrived'
    );
    
    return originalItem || null;
  };

  const exportTransactions = (format: 'csv' | 'json') => {
    if (transactions.length === 0) {
      toast({
        title: "No Data",
        description: "No transactions to export.",
        variant: "destructive",
      });
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const transactionData = transactions.map(t => ({
      ...t,
      itemName: getItemName(t.stockItemId),
      date: new Date(t.date).toISOString()
    }));
    
    if (format === 'csv') {
      const headers = ['date', 'itemName', 'type', 'quantity', 'reason', 'performedBy'];
      exportToCsv(transactionData, `transaction-history-${timestamp}.csv`, headers);
    } else {
      exportToJson(transactionData, `transaction-history-${timestamp}.json`);
    }

    toast({
      title: "Export Successful",
      description: `Transaction history exported as ${format.toUpperCase()}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
          <p className="text-muted-foreground">View and edit all stock movement transactions</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportTransactions('csv')}
            disabled={transactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportTransactions('json')}
            disabled={transactions.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Complete history of stock in and out movements</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Loading transactions...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <History className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No transactions yet. Transactions will appear here when you move items in or out of stock.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Performed By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((transaction) => {
                    const originalItem = getOriginalPurchaseItem(transaction.stockItemId);
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.date).toLocaleDateString()} {new Date(transaction.date).toLocaleTimeString()}
                        </TableCell>
                        <TableCell className="font-medium">{getItemName(transaction.stockItemId)}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            transaction.type === 'in' 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}>
                            {transaction.type === 'in' ? 'Stock In' : 'Stock Out'}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.quantity}</TableCell>
                        <TableCell>{transaction.reason}</TableCell>
                        <TableCell>{transaction.performedBy}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => startEdit(transaction)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Edit Transaction</DialogTitle>
                                  <DialogDescription>
                                    Edit transaction details for {getItemName(transaction.stockItemId)}
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                  <div>
                                    <Label htmlFor="type">Type</Label>
                                    <Select 
                                      value={editForm.type} 
                                      onValueChange={(value: 'in' | 'out') => setEditForm({...editForm, type: value})}
                                    >
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="in">Stock In</SelectItem>
                                        <SelectItem value="out">Stock Out</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                      id="quantity"
                                      value={editForm.quantity}
                                      onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                                      placeholder="Enter quantity"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="reason">Reason</Label>
                                    <Input
                                      id="reason"
                                      value={editForm.reason}
                                      onChange={(e) => setEditForm({...editForm, reason: e.target.value})}
                                      placeholder="Enter reason"
                                    />
                                  </div>
                                  <div>
                                    <Label htmlFor="performedBy">Performed By</Label>
                                    <Input
                                      id="performedBy"
                                      value={editForm.performedBy}
                                      onChange={(e) => setEditForm({...editForm, performedBy: e.target.value})}
                                      placeholder="Enter name"
                                    />
                                  </div>
                                  <div className="flex gap-2">
                                    <Button type="submit">Save Changes</Button>
                                    <Button 
                                      type="button" 
                                      variant="outline" 
                                      onClick={() => setEditingTransaction(null)}
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </form>
                              </DialogContent>
                            </Dialog>
                            {originalItem && (
                              <RepurchaseButton 
                                item={originalItem} 
                                onRepurchase={handleRepurchase}
                              />
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
