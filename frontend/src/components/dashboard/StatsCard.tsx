import { LucideIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn, formatCurrency } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  trend?: {
    value: number
    isPositive: boolean
  }
  variant?: 'default' | 'success' | 'warning' | 'destructive'
}

export function StatsCard({ title, value, icon: Icon, trend, variant = 'default' }: StatsCardProps) {
  const variantStyles = {
    default: 'bg-primary/12 text-primary ring-1 ring-primary/20',
    success: 'bg-success/12 text-success ring-1 ring-success/20',
    warning: 'bg-warning/12 text-warning ring-1 ring-warning/20',
    destructive: 'bg-destructive/12 text-destructive ring-1 ring-destructive/20',
  }

  return (
    <Card className="group relative overflow-hidden border-border/60 bg-card/60 backdrop-blur-sm transition-all duration-200 hover:-translate-y-px hover:border-primary/25 hover:shadow-[0_0_0_1px_hsl(var(--primary)/0.2),0_10px_30px_rgba(0,0,0,0.28)]">
      {/* soft accent wash */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_40%_at_20%_0%,hsl(var(--primary)/0.12),transparent_70%)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />

      <CardContent className="relative p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium text-muted-foreground/90">{title}</p>
            <p className="truncate text-2xl font-bold tracking-tight">{formatCurrency(value)}</p>
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.isPositive ? 'text-success' : 'text-destructive'
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}% from last month
              </p>
            )}
          </div>
          <div className={cn(
            'grid h-11 w-11 place-items-center rounded-xl transition-transform duration-200 group-hover:scale-[1.03]',
            variantStyles[variant],
          )}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
