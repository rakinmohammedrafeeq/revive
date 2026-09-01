import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Plus,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { AiInsights } from '@/components/dashboard/AiInsights'
import { formatCurrency } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useDashboardQuery } from '@/hooks'
import { GRID_STYLE, CHART_PALETTE } from '@/lib/chart-theme'

const TICK = { fill: 'hsl(var(--foreground))', fontSize: 11 }

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      {label ? <div className="mb-1 text-xs text-muted-foreground">{label}</div> : null}
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <span className="text-foreground/80">{p.name}</span>
            <span className="font-medium text-foreground">{formatCurrency(Number(p.value))}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { user } = useAuth()
  const { currentWorkspace } = useWorkspace()
  
  // Check workspace permission instead of platform role
  const canCreate = currentWorkspace?.userPermission === 'OWNER' || currentWorkspace?.userPermission === 'EDITOR'
  const { data, isLoading, error } = useDashboardQuery()

  const monthly = useMemo(
    () =>
      (data?.monthlyTrends ?? [])
        .map((m) => ({
          label: m.monthName || `${m.year}-${m.month}`,
          income: Number(m.income) || 0,
          expense: Number(m.expense) || 0,
        }))
        .filter((m) => !isNaN(m.income) && !isNaN(m.expense)),
    [data?.monthlyTrends],
  )

  const categories = useMemo(() => {
    const rows = [...(data?.categoryTotals ?? [])]
      .map((c) => ({
        name: c.category || 'Other',
        total: Number(c.total) || 0,
      }))
      .filter((c) => !isNaN(c.total) && c.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 8)
    return rows
  }, [data?.categoryTotals])

  const recent = data?.recentTransactions ?? []

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    )
  }

  // Handle 403 or other errors
  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name}</p>
          </div>
        </div>
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Wallet className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No records yet</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              {canCreate ? 'Add your first record to start tracking.' : 'Waiting for records to be added.'}
            </p>
            {canCreate && (
              <Button asChild className="gap-2 mt-6">
                <Link to="/app/records?add=true">
                  <Plus className="h-4 w-4" />
                  Add record
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreate ? (
            <Button asChild className="gap-2">
              <Link to="/app/records?add=true">
                <Plus className="h-4 w-4" />
                Add record
              </Link>
            </Button>
          ) : null}
          <Button variant="outline" asChild>
            <Link to="/app/records">All records</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard title="Total income" value={Number(data.totalIncome)} icon={ArrowUpRight} variant="success" />
        <StatsCard title="Total expenses" value={Number(data.totalExpenses)} icon={ArrowDownLeft} variant="warning" />
        <StatsCard title="Net balance" value={Number(data.netBalance)} icon={Landmark} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Cash flow</CardTitle>
            <CardDescription>Monthly income vs expenses</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-0">
            {monthly.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <AreaChart data={monthly} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PALETTE.income} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_PALETTE.income} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="dashExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={CHART_PALETTE.expense} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={CHART_PALETTE.expense} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...GRID_STYLE} vertical={false} />
                  <XAxis dataKey="label" tick={TICK} axisLine={false} tickLine={false} dy={8} />
                  <YAxis
                    tick={TICK}
                    axisLine={false}
                    tickLine={false}
                    width={48}
                    tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name="Income"
                    stroke={CHART_PALETTE.income}
                    strokeWidth={2}
                    fill="url(#dashIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name="Expenses"
                    stroke={CHART_PALETTE.expense}
                    strokeWidth={2}
                    fill="url(#dashExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-base">Top categories</CardTitle>
            <CardDescription>Spending by category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-0">
            {categories.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                <BarChart data={categories} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid {...GRID_STYLE} horizontal={false} />
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={96}
                    tick={TICK}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const row = payload[0].payload as { name: string; total: number }
                      return (
                        <div className="chart-tooltip">
                          <div className="font-medium text-foreground">{row.name}</div>
                          <div className="text-primary">{formatCurrency(row.total)}</div>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="total" radius={[0, 8, 8, 0]} fill={CHART_PALETTE.primary} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Section */}
      <AiInsights />

      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Recent activity</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </div>
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
                    <TableCell className="font-medium">{r.category}</TableCell>
                    <TableCell>
                      <Badge variant={r.type === 'INCOME' ? 'default' : 'secondary'}>{r.type}</Badge>
                    </TableCell>
                    <TableCell>{r.userName ?? '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(r.amount))}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
