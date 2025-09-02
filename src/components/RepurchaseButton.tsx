
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { PurchaseItem } from '@/types/stock';
import { useToast } from '@/hooks/use-toast';

interface RepurchaseButtonProps {
  item: PurchaseItem;
  onRepurchase: (item: PurchaseItem) => void;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg";
}

export function RepurchaseButton({ item, onRepurchase, variant = "outline", size = "sm" }: RepurchaseButtonProps) {
  const { toast } = useToast();

  const handleRepurchase = () => {
    onRepurchase(item);
    toast({
      title: "Item Repurchased",
      description: `${item.itemName} has been added to purchase list again.`,
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleRepurchase}
      title={`Repurchase ${item.itemName}`}
    >
      <RefreshCw className="w-4 h-4 mr-1" />
      Repurchase
    </Button>
  );
}
