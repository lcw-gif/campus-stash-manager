import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PurchaseItem, StockItem, BorrowRecord } from '@/types/stock';
import { loadPurchaseItems, loadStockItems, loadBorrowRecords } from '@/lib/storage';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, ArrowLeftRight, Clock } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

export default function Dashboard() {
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [borrowRecords, setBorrowRecords] = useState<BorrowRecord[]>([]);

  useEffect(() => {
    setPurchaseItems(loadPurchaseItems());
    setStockItems(loadStockItems());
    setBorrowRecords(loadBorrowRecords());
  }, []);

  const stats = {
    totalPurchases: purchaseItems.length,
    pendingDeliveries: purchaseItems.filter(item => item.status === 'waiting_delivery').length,
    arrivedItems: purchaseItems.filter(item => item.status === 'arrived').length,
    totalStockItems: stockItems.length,
    lowStockItems: stockItems.filter(item => item.availableQuantity < 5).length,
    activeBorrows: borrowRecords.filter(record => record.status === 'borrowed').length,
    totalBorrowedItems: borrowRecords.filter(record => record.status === 'borrowed').reduce((sum, record) => sum + record.quantity, 0),
  };

  const recentPurchases = purchaseItems
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const lowStockItems = stockItems
    .filter(item => item.availableQuantity < 5)
    .sort((a, b) => a.availableQuantity - b.availableQuantity);

  const recentBorrows = borrowRecords
    .filter(record => record.status === 'borrowed')
    .sort((a, b) => new Date(b.borrowDate).getTime() - new Date(a.borrowDate).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your school's stock management system</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPurchases}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Deliveries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.pendingDeliveries}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stock Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{stats.totalStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alert</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{stats.lowStockItems}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Borrows</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.activeBorrows}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Borrowed Quantity</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-info">{stats.totalBorrowedItems}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Purchases */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
            <CardDescription>Latest purchase activities</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPurchases.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No purchases yet</p>
            ) : (
              <div className="space-y-4">
                {recentPurchases.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.price} • Qty: {item.quantity}
                      </p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader>
            <CardTitle>Low Stock Alert</CardTitle>
            <CardDescription>Items that need restocking</CardDescription>
          </CardHeader>
          <CardContent>
            {lowStockItems.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">All items are well stocked</p>
            ) : (
              <div className="space-y-4">
                {lowStockItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{item.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        Location: {item.location}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-warning border-warning">
                      {item.availableQuantity} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Borrows */}
        <Card>
          <CardHeader>
            <CardTitle>Active Borrows</CardTitle>
            <CardDescription>Currently borrowed items</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBorrows.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No active borrows</p>
            ) : (
              <div className="space-y-4">
                {recentBorrows.map((record) => (
                  <div key={record.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{record.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {record.borrowerName} • Qty: {record.quantity}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <Clock className="w-3 h-3 mr-1" />
                      {Math.ceil((new Date().getTime() - record.borrowDate.getTime()) / (1000 * 60 * 60 * 24))}d
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}