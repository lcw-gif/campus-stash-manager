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
import { Package, Plus, Minus, MapPin, Download, Upload, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv, exportToJson, parseCSV, convertCsvToStockItems, readFileAsText } from '@/lib/fileUtils';

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
    setStockItems(loadStockItems());
    setTransactions(loadStockTransactions());
  }, []);

  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!addItemForm.itemName || !addItemForm.totalQuantity || !addItemForm.location || !addItemForm.purchasePrice) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const newStockItem: StockItem = {
      id: Date.now().toString(),
      itemName: addItemForm.itemName,
      totalQuantity: parseInt(addItemForm.totalQuantity),
      availableQuantity: parseInt(addItemForm.totalQuantity),
      location: addItemForm.location,
      courseTag: addItemForm.courseTag || undefined,
      purchasePrice: parseFloat(addItemForm.purchasePrice),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedItems = [...stockItems, newStockItem];
    setStockItems(updatedItems);
    saveStockItems(updatedItems);

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
  };

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
          {stockItems.length === 0 ? (
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
                                    setTransactionForm(prev => ({ ...prev, type: 'in' }));
                                  }}
                                >
                                  <Plus className="w-4 h-4 mr-1" />
                                  Add
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Add Stock</DialogTitle>
                                  <DialogDescription>
                                    Add items to stock for {item.itemName}
                                  </DialogDescription>
                                </DialogHeader>
                                <form onSubmit={handleTransaction} className="space-y-4">
                                  <div>
                                    <Label htmlFor="quantity">Quantity</Label>
                                    <Input
                                      id="quantity"
                                      type="number"
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