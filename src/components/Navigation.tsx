import { Link, useLocation } from 'react-router-dom';
import { Package, ShoppingCart, BarChart3, Search, History, ArrowLeftRight, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Dashboard', href: '/', icon: BarChart3 },
  { name: 'Purchase Management', href: '/purchase', icon: ShoppingCart },
  { name: 'Stock Management', href: '/stock', icon: Package },
  { name: 'Stock Take', href: '/stock-take', icon: ClipboardCheck },
  { name: 'Borrow Management', href: '/borrow', icon: ArrowLeftRight },
  { name: 'Transaction History', href: '/history', icon: History },
  { name: 'Search', href: '/search', icon: Search },
];

export function Navigation() {
  const location = useLocation();

  return (
    <nav className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <Package className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold text-foreground">School Stock System</span>
            </div>
          </div>
          
          <div className="flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors',
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                  )}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}