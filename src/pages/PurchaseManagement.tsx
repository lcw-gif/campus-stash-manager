import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { RepurchaseButton } from '@/components/RepurchaseButton';
import { PurchaseItem, PurchaseStatus } from '@/types/stock';
import { Plus, ExternalLink, Package, Download, Upload, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { exportToCsv, exportToJson, parseCSV, convertCsvToPurchaseItems, readFileAsText } from '@/lib/fileUtils';
import { purchaseItemSchema } from '@/lib/validationSchemas';
import { z } from 'zod';
import { DuplicateItemDialog } from '@/components/DuplicateItemDialog';

export default function PurchaseManagement() {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [duplicateItems, setDuplicateItems] = useState<PurchaseItem[]>([]);
  const [pendingItem, setPendingItem] = useState<any>(null);
  const [formData, setFormData] = useState({
    itemName: '',
    whereToBuy: '',
    price: '',
    quantity: '',
    link: '',
    status: 'considering' as PurchaseStatus,
    courseTag: '',
  });
  const [fileInputRef, setFileInputRef] = useState<HTMLInputElement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadPurchaseItems();
  }, []);

  const loadPurchaseItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('purchase_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setPurchaseItems(data?.map(item => ({
        id: item.id,
        itemId: `ITEM-${item.id.substring(0, 8).toUpperCase()}`,
        itemName: item.item_name,
        whereToBuy: item.where_to_buy || '',
        price: Number(item.price) || 0,
        quantity: item.quantity,
        link: item.link,
        status: item.status as PurchaseStatus,
        courseTag: item.course_tag,
        createdAt: new Date(item.created_at),
        updatedAt: new Date(item.updated_at),
      })) || []);
    } catch (error) {
      console.error('Error loading purchase items:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateItemId = () => {
    return 'ITEM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 3).toUpperCase();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const validated = purchaseItemSchema.parse({
        itemName: formData.itemName,
        whereToBuy: formData.whereToBuy,
        price: parseFloat(formData.price) || 0,
        quantity: parseInt(formData.quantity) || 0,
        link: formData.link,
        status: formData.status,
        courseTag: formData.courseTag,
      });

      // Check for duplicate item names
      const existingItems = purchaseItems.filter(item => 
        item.itemName.toLowerCase() === validated.itemName.toLowerCase()
      );
      
      if (existingItems.length > 0) {
        // Show duplicate dialog
        setDuplicateItems(existingItems);
        setPendingItem(validated);
        setIsDuplicateDialogOpen(true);
        return;
      }

      addNewItem();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      }
    }
  };

  const addNewItem = async (itemData?: any) => {
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

      const dataToUse = itemData || {
        itemName: formData.itemName,
        whereToBuy: formData.whereToBuy || 'Not specified',
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        link: formData.link,
        status: formData.status,
        courseTag: formData.courseTag,
      };

      const { data, error } = await supabase
        .from('purchase_items')
        .insert({
          user_id: user.id,
          item_name: dataToUse.itemName,
          where_to_buy: dataToUse.whereToBuy,
          price: dataToUse.price,
          quantity: dataToUse.quantity,
          link: dataToUse.link || null,
          status: dataToUse.status,
          course_tag: dataToUse.courseTag || null,
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
        status: data.status as PurchaseStatus,
        courseTag: data.course_tag,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
      };

      setPurchaseItems([newItem, ...purchaseItems]);

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
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add purchase item",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateConfirm = () => {
    addNewItem(pendingItem);
    setIsDuplicateDialogOpen(false);
    setPendingItem(null);
    setDuplicateItems([]);
  };

  const updateItemStatus = async (id: string, newStatus: PurchaseStatus) => {
    const currentItem = purchaseItems.find(item => item.id === id);
    if (!currentItem) return;

    try {
      const { error } = await supabase
        .from('purchase_items')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      const updatedItems = purchaseItems.map(item => 
        item.id === id 
          ? { ...item, status: newStatus, updatedAt: new Date() }
          : item
      );
      
      setPurchaseItems(updatedItems);

      // If status is changed to "arrived" or "stored", move to stock
      if ((newStatus === 'arrived' && currentItem.status !== 'arrived') || 
          (newStatus === 'stored' && currentItem.status !== 'stored')) {
        const item = updatedItems.find(item => item.id === id);
        if (item) {
          moveToStock(item);
        }
      }

      toast({
        title: "Status Updated",
        description: `Item status changed to ${newStatus.replace('_', ' ')}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const moveToStock = async (purchaseItem: PurchaseItem) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('stock_items')
        .insert({
          user_id: user.id,
          item_name: purchaseItem.itemName,
          quantity: purchaseItem.quantity,
          location: 'Warehouse',
          course_tag: purchaseItem.courseTag || null,
          purchase_price: purchaseItem.price,
        });

      toast({
        title: "Moved to Stock",
        description: `${purchaseItem.itemName} has been added to stock inventory.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move item to stock",
        variant: "destructive",
      });
    }
  };

  const handleRepurchase = async (item: PurchaseItem, quantity: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('purchase_items')
        .insert({
          user_id: user.id,
          item_name: item.itemName,
          where_to_buy: item.whereToBuy,
          price: item.price,
          quantity: quantity,
          link: item.link,
          status: 'considering',
          course_tag: item.courseTag,
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
        status: data.status as PurchaseStatus,
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

  const recordPresent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('purchase_items')
        .update({ 
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      const updatedItems = purchaseItems.map(item => 
        item.id === id 
          ? { ...item, isPresent: true, lastChecked: new Date(), updatedAt: new Date() }
          : item
      );
      
      setPurchaseItems(updatedItems);

      toast({
        title: "Item Recorded",
        description: "Item marked as present in inventory check.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to record item presence",
        variant: "destructive",
      });
    }
  };

  const exportPurchaseItems = (format: 'csv' | 'json') => {
    if (purchaseItems.length === 0) {
      toast({
        title: "No Data",
        description: "No purchase items to export.",
        variant: "destructive",
      });
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const headers = ['itemId', 'itemName', 'whereToBuy', 'price', 'quantity', 'status', 'courseTag', 'link'];
      exportToCsv(purchaseItems, `purchase-items-${timestamp}.csv`, headers);
    } else {
      exportToJson(purchaseItems, `purchase-items-${timestamp}.json`);
    }

    toast({
      title: "Export Successful",
      description: `Purchase items exported as ${format.toUpperCase()}`,
    });
  };

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileContent = await readFileAsText(file);
      
      if (file.name.endsWith('.csv')) {
        const csvData = parseCSV(fileContent);
        const newItems = convertCsvToPurchaseItems(csvData);
        
        if (newItems.length === 0) {
          toast({
            title: "Import Failed",
            description: "No valid items found in the CSV file. Please check the format.",
            variant: "destructive",
          });
          return;
        }

        // Note: CSV import adds items to local state only
        // In production, these should be saved to database
        const updatedItems = [...purchaseItems, ...newItems];
        setPurchaseItems(updatedItems);

        toast({
          title: "Import Successful",
          description: `${newItems.length} items imported successfully.`,
        });
      } else if (file.name.endsWith('.json')) {
        const jsonData = JSON.parse(fileContent);
        if (Array.isArray(jsonData)) {
          const validItems = jsonData.filter(item => 
            item.itemName && item.whereToBuy && item.price && item.quantity
          ).map(item => ({
            ...item,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            itemId: item.itemId || 'ITEM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 3).toUpperCase(),
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          if (validItems.length === 0) {
            toast({
              title: "Import Failed",
              description: "No valid items found in the JSON file.",
              variant: "destructive",
            });
            return;
          }

          // Note: JSON import adds items to local state only
          // In production, these should be saved to database
          const updatedItems = [...purchaseItems, ...validItems];
          setPurchaseItems(updatedItems);

          toast({
            title: "Import Successful",
            description: `${validItems.length} items imported successfully.`,
          });
        }
      }
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Failed to read or parse the file. Please check the file format.",
        variant: "destructive",
      });
    }

    // Reset file input
    event.target.value = '';
  };

  // Group items by name
  const groupedItems = purchaseItems.reduce((groups, item) => {
    const key = item.itemName.toLowerCase();
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, PurchaseItem[]>);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Purchase Management</h1>
          <p className="text-muted-foreground">Track and manage your purchase orders</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => exportPurchaseItems('csv')}
            disabled={purchaseItems.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button 
            variant="outline" 
            onClick={() => exportPurchaseItems('json')}
            disabled={purchaseItems.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export JSON
          </Button>
          <Button 
            variant="outline" 
            onClick={() => fileInputRef?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import File
          </Button>
          <input
            ref={setFileInputRef}
            type="file"
            accept=".csv,.json"
            onChange={handleFileImport}
            style={{ display: 'none' }}
          />
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Purchase Item
          </Button>
        </div>
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
                  <Label htmlFor="whereToBuy">Where to Buy</Label>
                  <Input
                    id="whereToBuy"
                    value={formData.whereToBuy}
                    onChange={(e) => setFormData({ ...formData, whereToBuy: e.target.value })}
                    placeholder="Store or supplier name (optional)"
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
                      <SelectItem value="stored">Stored</SelectItem>
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
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading purchase items...</p>
            </div>
          ) : purchaseItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No purchase items yet. Add your first item above.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item ID</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Where to Buy</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(groupedItems).map(([itemName, items]) => 
                  items.map((item, index) => (
                    <TableRow key={item.id} className={index > 0 ? "border-t-0" : ""}>
                      <TableCell className="font-mono text-xs">{item.itemId}</TableCell>
                      <TableCell className="font-medium">
                        {index === 0 && (
                          <div className="flex items-center gap-2">
                            {item.itemName}
                            {items.length > 1 && (
                              <span className="text-xs bg-muted px-2 py-1 rounded">
                                {items.length} entries
                              </span>
                            )}
                          </div>
                        )}
                        {index > 0 && (
                          <span className="text-muted-foreground text-sm ml-4">└ {item.itemName}</span>
                        )}
                      </TableCell>
                      <TableCell>{item.whereToBuy}</TableCell>
                      <TableCell>${item.price.toFixed(2)}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.courseTag || '-'}</TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          onValueChange={(value: PurchaseStatus) => updateItemStatus(item.id, value)}
                          disabled={item.status === 'arrived' || item.status === 'stored'}
                        >
                          <SelectTrigger className="w-40">
                            <StatusBadge status={item.status} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="considering">Considering</SelectItem>
                            <SelectItem value="not_consider">Not Consider</SelectItem>
                            <SelectItem value="waiting_delivery">Waiting Delivery</SelectItem>
                            <SelectItem value="arrived">Arrived</SelectItem>
                            <SelectItem value="stored">Stored</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {item.isPresent ? (
                          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-xs">
                              {item.lastChecked ? new Date(item.lastChecked).toLocaleDateString() : 'Present'}
                            </span>
                          </div>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => recordPresent(item.id)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Record Present
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {item.link && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={item.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                          <RepurchaseButton 
                            item={item} 
                            onRepurchase={handleRepurchase}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Item Dialog */}
      <DuplicateItemDialog
        isOpen={isDuplicateDialogOpen}
        onClose={() => {
          setIsDuplicateDialogOpen(false);
          setPendingItem(null);
          setDuplicateItems([]);
        }}
        onConfirm={handleDuplicateConfirm}
        existingItems={duplicateItems}
        newItem={pendingItem || { itemName: '', whereToBuy: '', price: 0, quantity: 0 }}
      />
    </div>
  );
}
