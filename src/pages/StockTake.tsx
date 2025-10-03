import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Play, CheckCircle2, AlertTriangle, FileText, RefreshCw, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { StockItem, StockTransaction } from '@/types/stock';
import { loadStockItems, saveStockItems, loadStockTransactions, saveStockTransactions } from '@/lib/storage';
import { Document, Packer, Paragraph, Table as DocxTable, TableRow as DocxTableRow, TableCell as DocxTableCell, TextRun, WidthType } from 'docx';

interface StockTakeItem extends StockItem {
  countedQuantity?: number;
  isChecked: boolean;
  quantityDifference?: number;
}

export default function StockTake() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [stockTakeItems, setStockTakeItems] = useState<StockTakeItem[]>([]);
  const [isStockTakeActive, setIsStockTakeActive] = useState(false);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const items = loadStockItems();
    setStockItems(items);
    
    // Check if there's an active stock take in progress
    const savedStockTake = localStorage.getItem('active_stock_take');
    if (savedStockTake) {
      const parsedStockTake = JSON.parse(savedStockTake);
      setStockTakeItems(parsedStockTake);
      setIsStockTakeActive(true);
    }
  }, []);

  const startStockTake = () => {
    const stockTakeItems: StockTakeItem[] = stockItems.map(item => ({
      ...item,
      isChecked: false,
      countedQuantity: undefined,
      quantityDifference: undefined,
    }));
    
    setStockTakeItems(stockTakeItems);
    setIsStockTakeActive(true);
    
    // Save to localStorage for persistence
    localStorage.setItem('active_stock_take', JSON.stringify(stockTakeItems));
    
    toast({
      title: "Stock Take Started",
      description: "All items have been reset. Start checking your inventory.",
    });
  };

  const updateCountedQuantity = (itemId: string, countedQuantity: number) => {
    const updatedItems = stockTakeItems.map(item => {
      if (item.id === itemId) {
        const difference = countedQuantity - item.availableQuantity;
        return {
          ...item,
          countedQuantity,
          isChecked: true,
          quantityDifference: difference,
        };
      }
      return item;
    });
    
    setStockTakeItems(updatedItems);
    localStorage.setItem('active_stock_take', JSON.stringify(updatedItems));
  };

  const submitStockTake = async () => {
    const changedItems = stockTakeItems.filter(item => 
      item.isChecked && item.quantityDifference !== undefined && item.quantityDifference !== 0
    );

    if (changedItems.length === 0) {
      toast({
        title: "No Changes",
        description: "No quantity changes detected in stock take.",
      });
      return;
    }

    // Update stock items with new quantities
    const updatedStockItems = stockItems.map(stockItem => {
      const stockTakeItem = stockTakeItems.find(item => item.id === stockItem.id);
      if (stockTakeItem && stockTakeItem.isChecked && stockTakeItem.countedQuantity !== undefined) {
        return {
          ...stockItem,
          availableQuantity: stockTakeItem.countedQuantity,
          totalQuantity: stockItem.totalQuantity + (stockTakeItem.quantityDifference || 0),
          updatedAt: new Date(),
        };
      }
      return stockItem;
    });

    setStockItems(updatedStockItems);
    saveStockItems(updatedStockItems);

    // Create transactions for all changes
    const transactions = loadStockTransactions();
    const newTransactions: StockTransaction[] = changedItems.map(item => ({
      id: `stocktake-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      stockItemId: item.id,
      type: (item.quantityDifference! > 0) ? 'in' : 'out',
      quantity: Math.abs(item.quantityDifference!),
      reason: 'Stock Take Update',
      performedBy: 'System - Stock Take',
      date: new Date(),
    }));

    const updatedTransactions = [...transactions, ...newTransactions];
    saveStockTransactions(updatedTransactions);

    // Generate and download report
    await generateStockTakeReport(changedItems);

    // Clear active stock take
    localStorage.removeItem('active_stock_take');
    setIsStockTakeActive(false);
    setStockTakeItems([]);
    setIsSubmitDialogOpen(false);

    toast({
      title: "Stock Take Completed",
      description: `${changedItems.length} items updated. Report downloaded.`,
    });
  };

  const generateStockTakeReport = async (changedItems: StockTakeItem[]) => {
    const reportDate = new Date().toLocaleDateString();
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: "STOCK TAKE REPORT",
                bold: true,
                size: 32,
              }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Date: ${reportDate}`,
                size: 24,
              }),
            ],
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: `Total Items Changed: ${changedItems.length}`,
                size: 24,
              }),
            ],
            spacing: { after: 600 },
          }),
          new DocxTable({
            width: {
              size: 100,
              type: WidthType.PERCENTAGE,
            },
            rows: [
              new DocxTableRow({
                children: [
                  new DocxTableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Item Name", bold: true })] })],
                  }),
                  new DocxTableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Previous Qty", bold: true })] })],
                  }),
                  new DocxTableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Counted Qty", bold: true })] })],
                  }),
                  new DocxTableCell({
                    children: [new Paragraph({ children: [new TextRun({ text: "Difference", bold: true })] })],
                  }),
                ],
              }),
              ...changedItems.map(item => 
                new DocxTableRow({
                  children: [
                    new DocxTableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.itemName })] })],
                    }),
                    new DocxTableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: item.availableQuantity.toString() })] })],
                    }),
                    new DocxTableCell({
                      children: [new Paragraph({ children: [new TextRun({ text: (item.countedQuantity || 0).toString() })] })],
                    }),
                    new DocxTableCell({
                      children: [new Paragraph({ 
                        children: [new TextRun({ 
                          text: (item.quantityDifference! > 0 ? "+" : "") + item.quantityDifference!.toString(),
                          color: item.quantityDifference! > 0 ? "00FF00" : "FF0000",
                          bold: true,
                        })] 
                      })],
                    }),
                  ],
                })
              ),
            ],
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const blob = new Blob([buffer], { 
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stock-take-report-${new Date().toISOString().split('T')[0]}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredStockTakeItems = stockTakeItems.filter(item =>
    item.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const checkedItems = stockTakeItems.filter(item => item.isChecked).length;
  const totalItems = stockTakeItems.length;
  const changedItems = stockTakeItems.filter(item => 
    item.isChecked && item.quantityDifference !== undefined && item.quantityDifference !== 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Stock Take</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Physical inventory count and reconciliation
          </p>
        </div>
        
        {!isStockTakeActive ? (
          <Button onClick={startStockTake} size="lg">
            <Play className="w-4 h-4 mr-2" />
            Start Stock Take
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                localStorage.removeItem('active_stock_take');
                setIsStockTakeActive(false);
                setStockTakeItems([]);
              }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reset
            </Button>
            <Dialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
              <DialogTrigger asChild>
                <Button disabled={checkedItems === 0}>
                  <FileText className="w-4 h-4 mr-2" />
                  Submit Stock Take
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Stock Take</DialogTitle>
                  <DialogDescription>
                    Review the changes before submitting
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="font-semibold text-lg">{checkedItems}/{totalItems}</div>
                      <div className="text-muted-foreground">Items Checked</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="font-semibold text-lg">{changedItems.length}</div>
                      <div className="text-muted-foreground">Items Changed</div>
                    </div>
                    <div className="text-center p-3 bg-muted rounded">
                      <div className="font-semibold text-lg">
                        {changedItems.reduce((sum, item) => sum + Math.abs(item.quantityDifference || 0), 0)}
                      </div>
                      <div className="text-muted-foreground">Total Adjustments</div>
                    </div>
                  </div>

                  {changedItems.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2">Items with Changes:</h4>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {changedItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm p-2 bg-muted rounded">
                            <span>{item.itemName}</span>
                            <span className={`font-semibold ${
                              (item.quantityDifference || 0) > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {(item.quantityDifference || 0) > 0 ? '+' : ''}{item.quantityDifference}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsSubmitDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={submitStockTake}>
                    Submit & Generate Report
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {!isStockTakeActive ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Stock Take Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Before Starting:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Ensure all items are in their designated locations</li>
                  <li>Have necessary counting tools ready</li>
                  <li>Notify team members about the stock take</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">During Stock Take:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Count each item physically</li>
                  <li>Update quantities for each item checked</li>
                  <li>Note any discrepancies or damages</li>
                </ul>
              </div>
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Starting a stock take will reset all current records. Make sure you're ready to begin the physical count.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Progress Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold">
                    {checkedItems}/{totalItems}
                  </div>
                  <div>
                    <div className="font-semibold">Items Checked</div>
                    <div className="text-sm text-muted-foreground">
                      {totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0}% Complete
                    </div>
                  </div>
                </div>
                
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Take Items */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Take Items</CardTitle>
              <CardDescription>
                Count each item and update the quantities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Item Name</TableHead>
                      <TableHead className="min-w-[100px]">Location</TableHead>
                      <TableHead className="min-w-[100px]">Current Qty</TableHead>
                      <TableHead className="min-w-[120px]">Counted Qty</TableHead>
                      <TableHead className="min-w-[100px]">Difference</TableHead>
                      <TableHead className="min-w-[80px]">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockTakeItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                          {searchTerm ? 'No items match your search' : 'No items to count'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredStockTakeItems.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.itemName}</div>
                              <div className="text-sm text-muted-foreground">
                                {item.courseTag || 'No course tag'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell className="font-semibold">
                            {item.availableQuantity}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={item.countedQuantity || ''}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseInt(e.target.value);
                                updateCountedQuantity(item.id, value);
                              }}
                              placeholder="Count"
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>
                            {item.quantityDifference !== undefined && (
                              <span className={`font-semibold ${
                                item.quantityDifference > 0 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : item.quantityDifference < 0 
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-muted-foreground'
                              }`}>
                                {item.quantityDifference > 0 ? '+' : ''}{item.quantityDifference}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {item.isChecked ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Checked
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                Pending
                              </Badge>
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
        </>
      )}
    </div>
  );
}