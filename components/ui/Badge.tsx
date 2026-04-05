import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'sale' | 'new' | 'stock' | 'default';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  sale: 'badge-sale',
  new: 'badge-new',
  stock: 'badge-stock',
  default: 'bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full text-xs font-medium',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return <span className={cn(variantClasses[variant], className)}>{children}</span>;
}
