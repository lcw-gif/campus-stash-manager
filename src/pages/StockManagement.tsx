import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { StockItem, StockTransaction } from '@/types/stock';
import { loadStockItems, saveStockItems, loadStockTransactions, saveStockTransactions } from '@/lib/storage';
import { Package, Plus, Minus, MapPin, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function StockManagement() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    type: 'in' as 'in' | 'out',
    quantity: '',
    reason: '',
    performedBy: '',
  });
  const [locationForm, setLocationForm] = useState({
    itemId: '',
    newLocation: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    setStockItems(loadStockItems());
    setTransactions(loadStockTransactions());
  }, []);

  const handleTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedItem || !transactionForm.quantity || !transactionForm.reason || !transactionForm.performedBy) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    const quantity = parseInt(transactionForm.quantity);
    const isStockOut = transactionForm.type === 'out';
    
    if (isStockOut && quantity > selectedItem.availableQuantity) {
      toast({
        title: "Error",
        description: "Cannot take out more items than available in stock.",
        variant: "destructive",
      });
      return;
    }

    const newTransaction: StockTransaction = {
      id: Date.now().toString(),
      stockItemId: selectedItem.id,
      type: transactionForm.type,
      quantity,
      reason: transactionForm.reason,
      performedBy: transactionForm.performedBy,
      date: new Date(),
    };

    const updatedTransactions = [...transactions, newTransaction];
    setTransactions(updatedTransactions);
    saveStockTransactions(updatedTransactions);

    // Update stock quantity
    const updatedStockItems = stockItems.map(item => 
      item.id === selectedItem.id
        ? {
            ...item,
            availableQuantity: isStockOut 
              ? item.availableQuantity - quantity 
              : item.availableQuantity + quantity,
            totalQuantity: transactionForm.type === 'in' 
              ? item.totalQuantity + quantity 
              : item.totalQuantity,
            updatedAt: new Date(),
          }
        : item
    );

    setStockItems(updatedStockItems);
    saveStockItems(updatedStockItems);

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
  };

  const updateLocation = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!locationForm.itemId || !locationForm.newLocation) {
      toast({
        title: "Error",
        description: "Please select an item and enter a new location.",
        variant: "destructive",
      });
      return;
    }

    const updatedStockItems = stockItems.map(item => 
      item.id === locationForm.itemId
        ? { ...item, location: locationForm.newLocation, updatedAt: new Date() }
        : item
    );

    setStockItems(updatedStockItems);
    saveStockItems(updatedStockItems);

    setLocationForm({
      itemId: '',
      newLocation: '',
    });

    toast({
      title: "Location Updated",
      description: "Item location has been successfully updated.",
    });
  };

  const getStockStatus = (item: StockItem) => {
    if (item.availableQuantity === 0) return { status: 'Out of Stock', color: 'text-destructive' };
    if (item.availableQuantity < 5) return { status: 'Low Stock', color: 'text-warning' };
    return { status: 'In Stock', color: 'text-success' };
  };

  const getItemTransactions = (itemId: string) => {
    return transactions
      .filter(t => t.stockItemId === itemId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Stock Management</h1>
        <p className="text-muted-foreground">Manage your inventory and track stock movements</p>
      </div>

      {/* Stock Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Stock Inventory</CardTitle>
          <CardDescription>Current stock levels and item details</CardDescription>
        </CardHeader>
        <CardContent>
          {stockItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No stock items yet. Items will appear here when purchase orders are marked as "arrived".
              </p>
            </div>
          ) : (
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
                  const recentTransactions = getItemTransactions(item.id);
                  
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
                                onClick={() => setSelectedItem(item)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                In
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Stock In</DialogTitle>
                                <DialogDescription>
                                  Add items to stock for {item.itemName}
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleTransaction} className="space-y-4">
                                <input type="hidden" value="in" onChange={() => setTransactionForm({...transactionForm, type: 'in'})} />
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
                                </div>
                                <div>
                                  <Label htmlFor="reason">Reason</Label>
                                  <Input
                                    id="reason"
                                    value={transactionForm.reason}
                                    onChange={(e) => setTransactionForm({...transactionForm, reason: e.target.value})}
                                    placeholder="e.g., New purchase, Return"
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
                                <Button type="submit" className="w-full">Add to Stock</Button>
                              </form>
                            </DialogContent>
                          </Dialog>

                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedItem(item)}
                                disabled={item.availableQuantity === 0}
                              >
                                <Minus className="w-4 h-4 mr-1" />
                                Out
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Stock Out</DialogTitle>
                                <DialogDescription>
                                  Remove items from stock for {item.itemName} (Available: {item.availableQuantity})
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={(e) => {
                                setTransactionForm({...transactionForm, type: 'out'});
                                handleTransaction(e);
                              }} className="space-y-4">
                                <div>
                                  <Label htmlFor="quantity">Quantity</Label>
                                  <Input
                                    id="quantity"
                                    type="number"
                                    min="1"
                                    max={item.availableQuantity}
                                    value={transactionForm.quantity}
                                    onChange={(e) => setTransactionForm({...transactionForm, quantity: e.target.value})}
                                    placeholder="Enter quantity"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="reason">Reason</Label>
                                  <Input
                                    id="reason"
                                    value={transactionForm.reason}
                                    onChange={(e) => setTransactionForm({...transactionForm, reason: e.target.value})}
                                    placeholder="e.g., Used in class, Damaged"
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
                                <Button type="submit" variant="destructive" className="w-full">
                                  Remove from Stock
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
          )}
        </CardContent>
      </Card>

      {/* Update Location */}
      <Card>
        <CardHeader>
          <CardTitle>Update Item Location</CardTitle>
          <CardDescription>Change the storage location of stock items</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={updateLocation} className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="itemSelect">Select Item</Label>
              <Select value={locationForm.itemId} onValueChange={(value) => setLocationForm({...locationForm, itemId: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an item" />
                </SelectTrigger>
                <SelectContent>
                  {stockItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.itemName} - {item.location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="newLocation">New Location</Label>
              <Input
                id="newLocation"
                value={locationForm.newLocation}
                onChange={(e) => setLocationForm({...locationForm, newLocation: e.target.value})}
                placeholder="e.g., Room 101, Storage A"
              />
            </div>
            <Button type="submit">
              <Edit className="w-4 h-4 mr-2" />
              Update Location
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}