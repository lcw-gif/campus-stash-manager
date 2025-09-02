
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw } from 'lucide-react';
import { PurchaseItem } from '@/types/stock';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

interface RepurchaseButtonProps {
  item: PurchaseItem;
  onRepurchase: (item: PurchaseItem, quantity: number) => void;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
}

export function RepurchaseButton({ item, onRepurchase, variant = "outline", size = "sm" }: RepurchaseButtonProps) {
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(item.quantity.toString());
  const [open, setOpen] = useState(false);

  const handleRepurchase = () => {
    const qty = parseInt(quantity) || item.quantity;
    onRepurchase(item, qty);
    setOpen(false);
    toast({
      title: "Item Repurchased",
      description: `${item.itemName} (${qty} units) has been added to purchase list again.`,
    });
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={variant}
          size={size}
          title={`Repurchase ${item.itemName}`}
        >
          <RefreshCw className="w-4 h-4 mr-1" />
          Repurchase
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Repurchase {item.itemName}</h4>
            <p className="text-sm text-muted-foreground">
              Original quantity: {item.quantity}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="repurchase-quantity">Quantity</Label>
            <Input
              id="repurchase-quantity"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleRepurchase} size="sm">
              Confirm Repurchase
            </Button>
            <Button variant="outline" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
