import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PurchaseItem, StockItem } from '@/types/stock';
import { loadPurchaseItems, loadStockItems } from '@/lib/storage';
import { Search, Package, ShoppingCart } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

// Helper function to escape regex special characters
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Safe text highlighting component
const HighlightText = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  
  const escapedQuery = escapeRegex(query);
  const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
  
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-yellow-200 px-1 rounded">{part}</mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
};

export default function SearchPage() {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPurchaseItems, setFilteredPurchaseItems] = useState<PurchaseItem[]>([]);
  const [filteredStockItems, setFilteredStockItems] = useState<StockItem[]>([]);

  useEffect(() => {
    setPurchaseItems(loadPurchaseItems());
    setStockItems(loadStockItems());
  }, []);

  useEffect(() => {
    const query = searchQuery.toLowerCase();
    
    if (!query) {
      setFilteredPurchaseItems(purchaseItems);
      setFilteredStockItems(stockItems);
      return;
    }

    const filteredPurchases = purchaseItems.filter(item =>
      item.itemName.toLowerCase().includes(query) ||
      (item.courseTag && item.courseTag.toLowerCase().includes(query)) ||
      item.whereToBuy.toLowerCase().includes(query)
    );

    const filteredStock = stockItems.filter(item =>
      item.itemName.toLowerCase().includes(query) ||
      (item.courseTag && item.courseTag.toLowerCase().includes(query)) ||
      item.location.toLowerCase().includes(query)
    );

    setFilteredPurchaseItems(filteredPurchases);
    setFilteredStockItems(filteredStock);
  }, [searchQuery, purchaseItems, stockItems]);

  const getStockStatusBadge = (item: StockItem) => {
    if (item.availableQuantity === 0) {
      return <Badge variant="destructive">Out of Stock</Badge>;
    }
    if (item.availableQuantity < 5) {
      return <Badge variant="outline" className="text-warning border-warning">Low Stock</Badge>;
    }
    return <Badge variant="outline" className="text-success border-success">In Stock</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Search Items</h1>
        <p className="text-muted-foreground">Search through purchases and stock by item name or course</p>
      </div>

      {/* Search Input */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by item name, course tag, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      <Tabs defaultValue="purchases" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="purchases" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            Purchases ({filteredPurchaseItems.length})
          </TabsTrigger>
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            Stock ({filteredStockItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="purchases">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Items</CardTitle>
              <CardDescription>
                Search results from purchase management
                {searchQuery && ` for "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPurchaseItems.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No purchase items found matching your search.' : 'No purchase items available.'}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Where to Buy</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPurchaseItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <HighlightText text={item.itemName} query={searchQuery} />
                        </TableCell>
                        <TableCell>{item.whereToBuy}</TableCell>
                        <TableCell>${item.price.toFixed(2)}</TableCell>
                        <TableCell>{item.quantity}</TableCell>
                        <TableCell>
                          {item.courseTag ? (
                            searchQuery && item.courseTag.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                              <HighlightText text={item.courseTag} query={searchQuery} />
                            ) : (
                              <Badge variant="outline">{item.courseTag}</Badge>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={item.status} />
                        </TableCell>
                        <TableCell>{item.createdAt.toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock">
          <Card>
            <CardHeader>
              <CardTitle>Stock Items</CardTitle>
              <CardDescription>
                Search results from stock inventory
                {searchQuery && ` for "${searchQuery}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredStockItems.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchQuery ? 'No stock items found matching your search.' : 'No stock items available.'}
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
                      <TableHead>Purchase Price</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStockItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <HighlightText text={item.itemName} query={searchQuery} />
                        </TableCell>
                        <TableCell className="font-bold">{item.availableQuantity}</TableCell>
                        <TableCell>{item.totalQuantity}</TableCell>
                        <TableCell>
                          <HighlightText text={item.location} query={searchQuery} />
                        </TableCell>
                        <TableCell>
                          {item.courseTag ? (
                            searchQuery && item.courseTag.toLowerCase().includes(searchQuery.toLowerCase()) ? (
                              <HighlightText text={item.courseTag} query={searchQuery} />
                            ) : (
                              <Badge variant="outline">{item.courseTag}</Badge>
                            )
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>{getStockStatusBadge(item)}</TableCell>
                        <TableCell>${item.purchasePrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}