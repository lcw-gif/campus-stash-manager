import { PurchaseItem, StockItem, StockTransaction, BorrowRecord } from '@/types/stock';

const STORAGE_KEYS = {
  PURCHASE_ITEMS: 'school_stock_purchase_items',
  STOCK_ITEMS: 'school_stock_items',
  STOCK_TRANSACTIONS: 'school_stock_transactions',
  BORROW_RECORDS: 'school_stock_borrow_records',
} as const;

// Purchase Items
export const savePurchaseItems = (items: PurchaseItem[]) => {
  localStorage.setItem(STORAGE_KEYS.PURCHASE_ITEMS, JSON.stringify(items));
};

export const loadPurchaseItems = (): PurchaseItem[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.PURCHASE_ITEMS);
  if (!stored) return [];
  
  return JSON.parse(stored).map((item: any) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
};

// Stock Items
export const saveStockItems = (items: StockItem[]) => {
  localStorage.setItem(STORAGE_KEYS.STOCK_ITEMS, JSON.stringify(items));
};

export const loadStockItems = (): StockItem[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.STOCK_ITEMS);
  if (!stored) return [];
  
  return JSON.parse(stored).map((item: any) => ({
    ...item,
    createdAt: new Date(item.createdAt),
    updatedAt: new Date(item.updatedAt),
  }));
};

// Stock Transactions
export const saveStockTransactions = (transactions: StockTransaction[]) => {
  localStorage.setItem(STORAGE_KEYS.STOCK_TRANSACTIONS, JSON.stringify(transactions));
};

export const loadStockTransactions = (): StockTransaction[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.STOCK_TRANSACTIONS);
  if (!stored) return [];
  
  return JSON.parse(stored).map((transaction: any) => ({
    ...transaction,
    date: new Date(transaction.date),
  }));
};

// Borrow Records
export const saveBorrowRecords = (records: BorrowRecord[]) => {
  localStorage.setItem(STORAGE_KEYS.BORROW_RECORDS, JSON.stringify(records));
};

export const loadBorrowRecords = (): BorrowRecord[] => {
  const stored = localStorage.getItem(STORAGE_KEYS.BORROW_RECORDS);
  if (!stored) return [];
  
  return JSON.parse(stored).map((record: any) => ({
    ...record,
    borrowDate: new Date(record.borrowDate),
    expectedReturnDate: record.expectedReturnDate ? new Date(record.expectedReturnDate) : undefined,
    actualReturnDate: record.actualReturnDate ? new Date(record.actualReturnDate) : undefined,
    createdAt: new Date(record.createdAt),
    updatedAt: new Date(record.updatedAt),
  }));
};