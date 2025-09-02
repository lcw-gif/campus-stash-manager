import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RepurchaseButton } from '@/components/RepurchaseButton';
import { StockTransaction, StockItem, PurchaseItem } from '@/types/stock';
import { loadStockTransactions, saveStockTransactions, loadStockItems, loadPurchaseItems, savePurchaseItems } from '@/lib/storage';
import { History, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function TransactionHistory() {
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<StockTransaction | null>(null);
  const [editForm, setEditForm] = useState({
    type: 'in' as 'in' | 'out',
    quantity: '',
    reason: '',
    performedBy: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    setTransactions(loadStockTransactions());
    setStockItems(loadStockItems());
    setPurchaseItems(loadPurchaseItems());
  }, []);

  const getItemName = (stockItemId: string) => {
    const item = stockItems.find(item => item.id === stockItemId);
    return item?.itemName || 'Unknown Item';
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingTransaction || !editForm.quantity || !editForm.reason || !editForm.performedBy) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

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
    saveStockTransactions(updatedTransactions);
    setEditingTransaction(null);

    toast({
      title: "Transaction Updated",
      description: "Transaction details have been updated successfully.",
    });
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

  const handleRepurchase = (originalItem: PurchaseItem, quantity: number) => {
    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      itemId: generateItemId(),
      itemName: originalItem.itemName,
      whereToBuy: originalItem.whereToBuy,
      price: originalItem.price,
      quantity: quantity,
      link: originalItem.link,
      status: 'considering',
      courseTag: originalItem.courseTag,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedPurchaseItems = [...purchaseItems, newItem];
    setPurchaseItems(updatedPurchaseItems);
    savePurchaseItems(updatedPurchaseItems);
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
        <p className="text-muted-foreground">View and edit all stock movement transactions</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Complete history of stock in and out movements</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
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
