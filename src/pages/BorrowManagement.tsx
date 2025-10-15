import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Plus, ArrowLeftRight, Search, CheckCircle2, Clock, Scan } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BorrowRecord, StockItem, BorrowStatus } from '@/types/stock';
import { BarcodeScanner } from '@/components/BarcodeScanner';
import { supabase } from '@/integrations/supabase/client';
import { borrowRecordSchema } from '@/lib/validationSchemas';
import { z } from 'zod';

export default function BorrowManagement() {
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BorrowStatus>('all');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    stockItemId: '',
    borrowerName: '',
    borrowerContact: '',
    quantity: 1,
    borrowDate: new Date(),
    expectedReturnDate: undefined as Date | undefined,
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: records } = await supabase
        .from('borrow_records')
        .select('*')
        .eq('user_id', user.id)
        .order('borrow_date', { ascending: false });

      const { data: items } = await supabase
        .from('stock_items')
        .select('*')
        .eq('user_id', user.id);

      setBorrowRecords(records?.map(r => ({
        id: r.id,
        stockItemId: r.item_id,
        itemName: r.item_name,
        borrowerName: r.borrower_name,
        borrowerContact: r.borrower_contact,
        quantity: r.quantity_borrowed,
        borrowDate: new Date(r.borrow_date),
        expectedReturnDate: r.expected_return_date ? new Date(r.expected_return_date) : undefined,
        actualReturnDate: r.actual_return_date ? new Date(r.actual_return_date) : undefined,
        status: r.status as BorrowStatus,
        notes: r.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
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
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBorrow = async () => {
    const selectedStockItem = stockItems.find(item => item.id === formData.stockItemId);
    if (!selectedStockItem) {
      toast({
        title: "Error",
        description: "Please select a valid stock item",
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

      const validated = borrowRecordSchema.parse({
        borrowerName: formData.borrowerName,
        borrowerContact: formData.borrowerContact,
        quantity: formData.quantity,
        notes: formData.notes,
      });

      if (validated.quantity > selectedStockItem.availableQuantity) {
        toast({
          title: "Error",
          description: "Insufficient stock available",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase
        .from('borrow_records')
        .insert({
          user_id: user.id,
          item_id: formData.stockItemId,
          item_name: selectedStockItem.itemName,
          borrower_name: validated.borrowerName,
          borrower_contact: validated.borrowerContact || '',
          quantity_borrowed: validated.quantity,
          borrow_date: formData.borrowDate.toISOString(),
          expected_return_date: formData.expectedReturnDate?.toISOString(),
          status: 'borrowed',
          notes: validated.notes || '',
        })
        .select()
        .single();

      if (error) throw error;

      const newBorrowRecord: BorrowRecord = {
        id: data.id,
        stockItemId: data.item_id,
        itemName: data.item_name,
        borrowerName: data.borrower_name,
        borrowerContact: data.borrower_contact,
        quantity: data.quantity_borrowed,
        borrowDate: new Date(data.borrow_date),
        expectedReturnDate: data.expected_return_date ? new Date(data.expected_return_date) : undefined,
        status: data.status as BorrowStatus,
        notes: data.notes || '',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      setBorrowRecords([newBorrowRecord, ...borrowRecords]);

      // Update stock item available quantity
      const newQuantity = selectedStockItem.availableQuantity - validated.quantity;
      await supabase
        .from('stock_items')
        .update({ quantity: newQuantity })
        .eq('id', formData.stockItemId);

      const updatedStockItems = stockItems.map(item =>
        item.id === formData.stockItemId
          ? { ...item, availableQuantity: newQuantity, updatedAt: new Date() }
          : item
      );
      setStockItems(updatedStockItems);

      toast({
        title: "Success",
        description: "Borrow record created successfully",
      });

      // Reset form
      setFormData({
        stockItemId: '',
        borrowerName: '',
        borrowerContact: '',
        quantity: 1,
        borrowDate: new Date(),
        expectedReturnDate: undefined,
        notes: '',
      });
      setIsAddDialogOpen(false);
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

  const handleReturnItem = async () => {
    if (!selectedRecord) return;

    try {
      const { error } = await supabase
        .from('borrow_records')
        .update({ 
          status: 'returned',
          actual_return_date: new Date().toISOString()
        })
        .eq('id', selectedRecord.id);

      if (error) throw error;

      const updatedRecords = borrowRecords.map(record =>
        record.id === selectedRecord.id
          ? { 
              ...record, 
              status: 'returned' as BorrowStatus,
              actualReturnDate: new Date(),
              updatedAt: new Date()
            }
          : record
      );
      setBorrowRecords(updatedRecords);

      // Update stock item available quantity
      const stockItem = stockItems.find(item => item.id === selectedRecord.stockItemId);
      if (stockItem) {
        const newQuantity = stockItem.availableQuantity + selectedRecord.quantity;
        await supabase
          .from('stock_items')
          .update({ quantity: newQuantity })
          .eq('id', selectedRecord.stockItemId);

        const updatedStockItems = stockItems.map(item =>
          item.id === selectedRecord.stockItemId
            ? { ...item, availableQuantity: newQuantity, updatedAt: new Date() }
            : item
        );
        setStockItems(updatedStockItems);
      }

      toast({
        title: "Success",
        description: "Item returned successfully",
      });

      setIsReturnDialogOpen(false);
      setSelectedRecord(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to return item",
        variant: "destructive",
      });
    }
  };

  const filteredRecords = borrowRecords.filter(record => {
    const matchesSearch = record.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.borrowerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableStockItems = stockItems.filter(item => item.availableQuantity > 0);

  const handleBarcodeScan = (result: string) => {
    // Try to find item by name or ID
    const foundItem = availableStockItems.find(item => 
      item.itemName.toLowerCase().includes(result.toLowerCase()) ||
      item.id === result
    );
    
    if (foundItem) {
      setFormData(prev => ({ ...prev, stockItemId: foundItem.id }));
      toast({
        title: "Item Found",
        description: `Selected: ${foundItem.itemName}`,
      });
    } else {
      toast({
        title: "Item Not Found",
        description: "No matching item found for this barcode",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Borrow Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track borrowed items and returns</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Borrow Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Borrow Record</DialogTitle>
                <DialogDescription>
                  Record a new item borrow
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="stockItem">Stock Item</Label>
                  <div className="flex gap-2">
                    <Select
                      value={formData.stockItemId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, stockItemId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an item to borrow" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableStockItems.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            {item.itemName} (Available: {item.availableQuantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsScannerOpen(true)}
                    >
                      <Scan className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="borrowerName">Borrower Name *</Label>
                  <Input
                    id="borrowerName"
                    value={formData.borrowerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, borrowerName: e.target.value }))}
                    placeholder="Enter borrower name"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="borrowerContact">Borrower Contact</Label>
                  <Input
                    id="borrowerContact"
                    value={formData.borrowerContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, borrowerContact: e.target.value }))}
                    placeholder="Phone number or email"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    value={formData.quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Borrow Date *</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.borrowDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.borrowDate ? format(formData.borrowDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.borrowDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, borrowDate: date || new Date() }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label>Expected Return Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal",
                          !formData.expectedReturnDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.expectedReturnDate ? format(formData.expectedReturnDate, "PPP") : "Pick a date (optional)"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.expectedReturnDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, expectedReturnDate: date }))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes (optional)"
                  />
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" onClick={handleAddBorrow}>
                  Add Borrow Record
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          <Button 
            variant="outline" 
            className="w-full sm:w-auto"
            onClick={() => setIsScannerOpen(true)}
          >
            <Scan className="w-4 h-4 mr-2" />
            Scan Barcode
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by item name or borrower..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="borrowed">Borrowed</SelectItem>
                <SelectItem value="returned">Returned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Borrow Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5" />
            Borrow Records ({filteredRecords.length})
          </CardTitle>
          <CardDescription>
            Track all borrowed items and their return status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Item Name</TableHead>
                  <TableHead className="min-w-[120px]">Borrower</TableHead>
                  <TableHead className="min-w-[100px]">Contact</TableHead>
                  <TableHead className="min-w-[80px]">Quantity</TableHead>
                  <TableHead className="min-w-[110px]">Borrow Date</TableHead>
                  <TableHead className="min-w-[110px]">Expected Return</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Loading borrow records...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      No borrow records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.itemName}</TableCell>
                      <TableCell>{record.borrowerName}</TableCell>
                      <TableCell>{record.borrowerContact || '-'}</TableCell>
                      <TableCell>{record.quantity}</TableCell>
                      <TableCell>{format(record.borrowDate, "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        {record.expectedReturnDate ? format(record.expectedReturnDate, "MMM dd, yyyy") : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.status === 'borrowed' ? 'destructive' : 'default'}>
                          {record.status === 'borrowed' ? (
                            <><Clock className="w-3 h-3 mr-1" /> Borrowed</>
                          ) : (
                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Returned</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {record.status === 'borrowed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRecord(record);
                              setIsReturnDialogOpen(true);
                            }}
                          >
                            Return
                          </Button>
                        )}
                        {record.status === 'returned' && record.actualReturnDate && (
                          <span className="text-sm text-muted-foreground">
                            Returned {format(record.actualReturnDate, "MMM dd")}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Return Dialog */}
      <Dialog open={isReturnDialogOpen} onOpenChange={setIsReturnDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Item</DialogTitle>
            <DialogDescription>
              Confirm the return of {selectedRecord?.itemName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Item:</span> {selectedRecord.itemName}
                </div>
                <div>
                  <span className="font-medium">Quantity:</span> {selectedRecord.quantity}
                </div>
                <div>
                  <span className="font-medium">Borrower:</span> {selectedRecord.borrowerName}
                </div>
                <div>
                  <span className="font-medium">Borrow Date:</span> {format(selectedRecord.borrowDate, "MMM dd, yyyy")}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsReturnDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleReturnItem}>
              Confirm Return
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Barcode Scanner */}
      <BarcodeScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
}