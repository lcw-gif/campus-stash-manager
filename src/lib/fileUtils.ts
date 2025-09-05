import { PurchaseItem, StockItem, StockTransaction } from '@/types/stock';

// Export functions
export const exportToCsv = (data: any[], filename: string, headers: string[]) => {
  const csvContent = [
    headers.join(','),
    ...data.map(item => headers.map(header => {
      const value = getNestedValue(item, header);
      return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }).join(','))
  ].join('\n');

  downloadFile(csvContent, filename, 'text/csv');
};

export const exportToJson = (data: any[], filename: string) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json');
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const getNestedValue = (obj: any, path: string): any => {
  return path.split('.').reduce((current, key) => current?.[key], obj) || '';
};

// Import functions
export const parseCSV = (csvText: string): string[][] => {
  const lines = csvText.trim().split('\n');
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"' && !inQuotes) {
        inQuotes = true;
      } else if (char === '"' && inQuotes) {
        inQuotes = false;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  });
};

export const validatePurchaseItem = (item: any): boolean => {
  return !!(item.itemName && item.whereToBuy && item.price && item.quantity);
};

export const validateStockItem = (item: any): boolean => {
  return !!(item.itemName && item.totalQuantity && item.availableQuantity);
};

export const validateTransaction = (transaction: any): boolean => {
  return !!(transaction.type && transaction.quantity && transaction.reason && transaction.performedBy);
};

export const convertCsvToPurchaseItems = (csvData: string[][]): PurchaseItem[] => {
  if (csvData.length < 2) return [];
  
  const headers = csvData[0].map(h => h.toLowerCase().replace(/\s+/g, ''));
  const items: PurchaseItem[] = [];
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (row.length < headers.length) continue;
    
    const item: any = {};
    headers.forEach((header, index) => {
      const value = row[index];
      
      switch (header) {
        case 'itemname':
        case 'name':
          item.itemName = value;
          break;
        case 'wheretobuy':
        case 'supplier':
          item.whereToBuy = value;
          break;
        case 'price':
          item.price = parseFloat(value) || 0;
          break;
        case 'quantity':
        case 'qty':
          item.quantity = parseInt(value) || 0;
          break;
        case 'link':
        case 'url':
          item.link = value;
          break;
        case 'status':
          item.status = value || 'considering';
          break;
        case 'coursetag':
        case 'course':
          item.courseTag = value;
          break;
      }
    });
    
    if (validatePurchaseItem(item)) {
      const newItem: PurchaseItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        itemId: 'ITEM-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 3).toUpperCase(),
        itemName: item.itemName,
        whereToBuy: item.whereToBuy,
        price: item.price,
        quantity: item.quantity,
        link: item.link || undefined,
        status: item.status,
        courseTag: item.courseTag || undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      items.push(newItem);
    }
  }
  
  return items;
};

export const convertCsvToStockItems = (csvData: string[][]): StockItem[] => {
  if (csvData.length < 2) return [];
  
  const headers = csvData[0].map(h => h.toLowerCase().replace(/\s+/g, ''));
  const items: StockItem[] = [];
  
  for (let i = 1; i < csvData.length; i++) {
    const row = csvData[i];
    if (row.length < headers.length) continue;
    
    const item: any = {};
    headers.forEach((header, index) => {
      const value = row[index];
      
      switch (header) {
        case 'itemname':
        case 'name':
          item.itemName = value;
          break;
        case 'totalquantity':
        case 'total':
          item.totalQuantity = parseInt(value) || 0;
          break;
        case 'availablequantity':
        case 'available':
          item.availableQuantity = parseInt(value) || 0;
          break;
        case 'location':
          item.location = value || 'Warehouse';
          break;
        case 'coursetag':
        case 'course':
          item.courseTag = value;
          break;
        case 'purchaseprice':
        case 'price':
          item.purchasePrice = parseFloat(value) || 0;
          break;
      }
    });
    
    if (validateStockItem(item)) {
      const newItem: StockItem = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        itemName: item.itemName,
        totalQuantity: item.totalQuantity,
        availableQuantity: item.availableQuantity,
        location: item.location,
        courseTag: item.courseTag || undefined,
        purchasePrice: item.purchasePrice,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      items.push(newItem);
    }
  }
  
  return items;
};

// File reading utility
export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};