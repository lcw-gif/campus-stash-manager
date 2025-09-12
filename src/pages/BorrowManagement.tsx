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
import { CalendarIcon, Plus, ArrowLeftRight, Search, CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BorrowRecord, StockItem, BorrowStatus } from '@/types/stock';
import { loadBorrowRecords, saveBorrowRecords, loadStockItems, saveStockItems } from '@/lib/storage';

export default function BorrowManagement() {
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<BorrowRecord | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | BorrowStatus>('all');
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
    setBorrowRecords(loadBorrowRecords());
    setStockItems(loadStockItems());
  }, []);

  const handleAddBorrow = () => {
    const selectedStockItem = stockItems.find(item => item.id === formData.stockItemId);
    if (!selectedStockItem) {
      toast({
        title: "Error",
        description: "Please select a valid stock item",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity > selectedStockItem.availableQuantity) {
      toast({
        title: "Error",
        description: "Insufficient stock available",
        variant: "destructive",
      });
      return;
    }

    if (!formData.borrowerName.trim()) {
      toast({
        title: "Error",
        description: "Please enter borrower name",
        variant: "destructive",
      });
      return;
    }

    const newBorrowRecord: BorrowRecord = {
      id: `borrow-${Date.now()}`,
      stockItemId: formData.stockItemId,
      itemName: selectedStockItem.itemName,
      borrowerName: formData.borrowerName.trim(),
      borrowerContact: formData.borrowerContact.trim(),
      quantity: formData.quantity,
      borrowDate: formData.borrowDate,
      expectedReturnDate: formData.expectedReturnDate,
      status: 'borrowed',
      notes: formData.notes.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updatedRecords = [...borrowRecords, newBorrowRecord];
    setBorrowRecords(updatedRecords);
    saveBorrowRecords(updatedRecords);

    // Update stock item available quantity
    const updatedStockItems = stockItems.map(item =>
      item.id === formData.stockItemId
        ? { ...item, availableQuantity: item.availableQuantity - formData.quantity, updatedAt: new Date() }
        : item
    );
    setStockItems(updatedStockItems);
    saveStockItems(updatedStockItems);

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
  };

  const handleReturnItem = () => {
    if (!selectedRecord) return;

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
    saveBorrowRecords(updatedRecords);

    // Update stock item available quantity
    const updatedStockItems = stockItems.map(item =>
      item.id === selectedRecord.stockItemId
        ? { ...item, availableQuantity: item.availableQuantity + selectedRecord.quantity, updatedAt: new Date() }
        : item
    );
    setStockItems(updatedStockItems);
    saveStockItems(updatedStockItems);

    toast({
      title: "Success",
      description: "Item returned successfully",
    });

    setIsReturnDialogOpen(false);
    setSelectedRecord(null);
  };

  const filteredRecords = borrowRecords.filter(record => {
    const matchesSearch = record.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.borrowerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const availableStockItems = stockItems.filter(item => item.availableQuantity > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Borrow Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Track borrowed items and returns</p>
        </div>
        
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
                {filteredRecords.length === 0 ? (
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
    </div>
  );
}