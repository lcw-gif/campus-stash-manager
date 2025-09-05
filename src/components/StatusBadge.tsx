import { Badge } from '@/components/ui/badge';
import { PurchaseStatus } from '@/types/stock';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: PurchaseStatus;
  className?: string;
}

const statusConfig = {
  considering: {
    label: 'Considering',
    className: 'bg-warning text-warning-foreground hover:bg-warning/80',
  },
  not_consider: {
    label: 'Not Consider',
    className: 'bg-muted text-muted-foreground hover:bg-muted/80',
  },
  waiting_delivery: {
    label: 'Waiting Delivery',
    className: 'bg-info text-info-foreground hover:bg-info/80',
  },
  arrived: {
    label: 'Arrived',
    className: 'bg-success text-success-foreground hover:bg-success/80',
  },
  stored: {
    label: 'Stored',
    className: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      className={cn(config.className, className)}
      variant="secondary"
    >
      {config.label}
    </Badge>
  );
}