import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Info } from 'lucide-react';
import { PurchaseItem } from '@/types/stock';

interface DuplicateItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  existingItems: PurchaseItem[];
  newItem: {
    itemName: string;
    whereToBuy: string;
    price: number;
    quantity: number;
  };
}

export function DuplicateItemDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  existingItems, 
  newItem 
}: DuplicateItemDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="w-5 h-5 text-amber-500" />
            Duplicate Item Detected
          </DialogTitle>
          <DialogDescription>
            An item with the name "{newItem.itemName}" already exists. Would you like to add this as another entry?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <div className="font-semibold text-sm mb-2">New Item:</div>
            <div className="text-sm">
              <div><span className="font-medium">Where to Buy:</span> {newItem.whereToBuy || 'Not specified'}</div>
              <div><span className="font-medium">Price:</span> ${newItem.price.toFixed(2)}</div>
              <div><span className="font-medium">Quantity:</span> {newItem.quantity}</div>
            </div>
          </div>

          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <span>View Existing Entries ({existingItems.length})</span>
                <ChevronDown className="w-4 h-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {existingItems.map((item, index) => (
                <div key={item.id} className="p-2 bg-muted/50 rounded text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium">Entry #{index + 1}</span>
                    <Badge variant={item.status === 'arrived' ? 'default' : 'secondary'} className="text-xs">
                      {item.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div><span className="text-muted-foreground">From:</span> {item.whereToBuy}</div>
                  <div><span className="text-muted-foreground">Price:</span> ${item.price.toFixed(2)}</div>
                  <div><span className="text-muted-foreground">Qty:</span> {item.quantity}</div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            Add as New Entry
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}