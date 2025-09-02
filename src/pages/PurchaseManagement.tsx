import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { PurchaseItem, PurchaseStatus } from '@/types/stock';
import { loadPurchaseItems, savePurchaseItems, loadStockItems, saveStockItems } from '@/lib/storage';
import { Plus, ExternalLink, Package } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PurchaseManagement() {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    itemName: '',
    whereToBuy: '',
    price: '',
    quantity: '',
    link: '',
    status: 'considering' as PurchaseStatus,
    courseTag: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    setPurchaseItems(loadPurchaseItems());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemName || !formData.whereToBuy || !formData.price || !formData.quantity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check for duplicate item names
    const existingItem = purchaseItems.find(item => 
      item.itemName.toLowerCase() === formData.itemName.toLowerCase()
    );
    
    if (existingItem) {
      toast({
        title: "Duplicate Item",
        description: "An item with this name already exists in purchase management.",
        variant: "destructive",
      });
      return;
    }

    const newItem: PurchaseItem = {
      id: Date.now().toString(),
      itemName: formData.itemName,
      whereToBuy: formData.whereToBuy,
      price: parseFloat(formData.price),
      quantity: parseInt(formData.quantity),
      link: formData.link || undefined,
      status: formData.status,
      courseTag: formData.courseTag || undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedItems = [...purchaseItems, newItem];
    setPurchaseItems(updatedItems);
    savePurchaseItems(updatedItems);

    setFormData({
      itemName: '',
      whereToBuy: '',
      price: '',
      quantity: '',
      link: '',
      status: 'considering',
      courseTag: '',
    });
    setShowAddForm(false);

    toast({
      title: "Success",
      description: "Purchase item added successfully!",
    });
  };

  const updateItemStatus = (id: string, newStatus: PurchaseStatus) => {
    const currentItem = purchaseItems.find(item => item.id === id);
    if (!currentItem) return;

    const updatedItems = purchaseItems.map(item => 
      item.id === id 
        ? { ...item, status: newStatus, updatedAt: new Date() }
        : item
    );
    
    setPurchaseItems(updatedItems);
    savePurchaseItems(updatedItems);

    // If status is changed to "arrived" and it wasn't already arrived, move to stock
    if (newStatus === 'arrived' && currentItem.status !== 'arrived') {
      const arrivedItem = updatedItems.find(item => item.id === id);
      if (arrivedItem) {
        moveToStock(arrivedItem);
      }
    }

    toast({
      title: "Status Updated",
      description: `Item status changed to ${newStatus.replace('_', ' ')}`,
    });
  };

  const moveToStock = (purchaseItem: PurchaseItem) => {
    const stockItems = loadStockItems();
    
    const newStockItem = {
      id: Date.now().toString(),
      itemName: purchaseItem.itemName,
      totalQuantity: purchaseItem.quantity,
      availableQuantity: purchaseItem.quantity,
      location: 'Warehouse', // Default location
      courseTag: purchaseItem.courseTag,
      purchasePrice: purchaseItem.price,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedStockItems = [...stockItems, newStockItem];
    saveStockItems(updatedStockItems);

    toast({
      title: "Moved to Stock",
      description: `${purchaseItem.itemName} has been added to stock inventory.`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Management</h1>
          <p className="text-muted-foreground">Track and manage your purchase orders</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Purchase Item
        </Button>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Purchase Item</CardTitle>
            <CardDescription>Enter details for a new purchase order</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="itemName">Item Name *</Label>
                  <Input
                    id="itemName"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="Enter item name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="whereToBuy">Where to Buy *</Label>
                  <Input
                    id="whereToBuy"
                    value={formData.whereToBuy}
                    onChange={(e) => setFormData({ ...formData, whereToBuy: e.target.value })}
                    placeholder="Store or supplier name"
                  />
                </div>
                
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <Label htmlFor="quantity">Quantity *</Label>
                  <Input
                    id="quantity"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="courseTag">Course Tag</Label>
                  <Input
                    id="courseTag"
                    value={formData.courseTag}
                    onChange={(e) => setFormData({ ...formData, courseTag: e.target.value })}
                    placeholder="e.g., Chemistry, Physics"
                  />
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value: PurchaseStatus) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="considering">Considering</SelectItem>
                      <SelectItem value="not_consider">Not Consider</SelectItem>
                      <SelectItem value="waiting_delivery">Waiting Delivery</SelectItem>
                      <SelectItem value="arrived">Arrived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="link">Purchase Link</Label>
                <Input
                  id="link"
                  value={formData.link}
                  onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                  placeholder="https://..."
                />
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

      {/* Purchase Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>Purchase Items</CardTitle>
          <CardDescription>All purchase orders and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          {purchaseItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No purchase items yet. Add your first item above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Where to Buy</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.itemName}</TableCell>
                    <TableCell>{item.whereToBuy}</TableCell>
                    <TableCell>${item.price.toFixed(2)}</TableCell>
                    <TableCell>{item.quantity}</TableCell>
                    <TableCell>{item.courseTag || '-'}</TableCell>
                    <TableCell>
                      <Select
                        value={item.status}
                        onValueChange={(value: PurchaseStatus) => updateItemStatus(item.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <StatusBadge status={item.status} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="considering">Considering</SelectItem>
                          <SelectItem value="not_consider">Not Consider</SelectItem>
                          <SelectItem value="waiting_delivery">Waiting Delivery</SelectItem>
                          <SelectItem value="arrived">Arrived</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {item.link && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={item.link} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}