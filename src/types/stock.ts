export type PurchaseStatus = 'considering' | 'not_consider' | 'waiting_delivery' | 'arrived';
export type StockStatus = 'available' | 'low_stock' | 'out_of_stock';

export interface PurchaseItem {
  id: string;
  itemName: string;
  whereToBuy: string;
  price: number;
  quantity: number;
  link?: string;
  status: PurchaseStatus;
  courseTag?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockItem {
  id: string;
  itemName: string;
  totalQuantity: number;
  availableQuantity: number;
  location: string;
  courseTag?: string;
  purchasePrice: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockTransaction {
  id: string;
  stockItemId: string;
  type: 'in' | 'out';
  quantity: number;
  reason: string;
  performedBy: string;
  date: Date;
}