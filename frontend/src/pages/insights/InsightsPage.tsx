import { TrendingUp, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BarChart, 
  Bar, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))']

// Mock data - will be replaced with real API
const recoveryTrendData = [
  { month: 'Jan', detected: 45, recovered: 28, failed: 12 },
  { month: 'Feb', detected: 52, recovered: 34, failed: 15 },
  { month: 'Mar', detected: 48, recovered: 35, failed: 10 },
  { month: 'Apr', detected: 61, recovered: 42, failed: 14 },
  { month: 'May', detected: 55, recovered: 39, failed: 11 },
  { month: 'Jun', detected: 67, recovered: 48, failed: 13 },
]

const failureReasonsData = [
  { name: 'Insufficient Funds', value: 35 },
  { name: 'Card Expired', value: 25 },
  { name: 'Payment Declined', value: 20 },
  { name: 'Authentication Failed', value: 12 },
  { name: 'Other', value: 8 },
]

const interventionData = [
  { type: 'Retry after 24h', success: 68, attempts: 102 },
  { type: 'Update payment method', success: 82, attempts: 45 },
  { type: 'Contact customer', success: 55, attempts: 38 },
  { type: 'Manual review', success: 71, attempts: 28 },
]

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="chart-tooltip">
      <div className="space-y-1">
        {payload.map((p: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4 text-xs">
            <span className="text-foreground/80">{p.name}</span>
            <span className="font-medium text-foreground">{p.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function InsightsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">See the bigger picture</h1>
        <p className="text-muted-foreground mt-1">
          Recovery analytics and performance metrics
        </p>
      </div>

      {/* AI Insights */}
      <Card className="glass-card border-primary/30 emerald-glow">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-primary/10 p-2">
              <TrendingUp className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-primary">Revive spotted something</CardTitle>
              <CardDescription className="mt-1.5">
                Retrying failed payments after 24 hours has recovered 31% more revenue compared to immediate retries. This pattern holds across similar merchants.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              High confidence
            </Badge>
            <Badge variant="outline">Based on 156 cases</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">How much we're winning back</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">68%</div>
            <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Recovery Time</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.4 days</div>
            <p className="text-xs text-muted-foreground mt-1">-0.6 days improvement</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">What we brought back</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹4.8L</div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Permanently</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18%</div>
            <p className="text-xs text-muted-foreground mt-1">32 cases</p>
          </CardContent>
        </Card>
      </div>

      {/* Recovery Trend */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Recovery Performance</CardTitle>
          <CardDescription>Detection, recovery, and failure trends over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={recoveryTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
              <XAxis dataKey="month" stroke="var(--chart-axis)" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
              <YAxis stroke="var(--chart-axis)" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line 
                type="monotone" 
                dataKey="detected" 
                stroke="hsl(var(--muted-foreground))" 
                strokeWidth={2}
                name="Detected"
              />
              <Line 
                type="monotone" 
                dataKey="recovered" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Recovered"
              />
              <Line 
                type="monotone" 
                dataKey="failed" 
                stroke="hsl(var(--destructive))" 
                strokeWidth={2}
                name="Failed"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Failure Reasons */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Failure Reasons</CardTitle>
            <CardDescription>Common causes of payment failures</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={failureReasonsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {failureReasonsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {failureReasonsData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="h-3 w-3 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Intervention Success */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Intervention Outcomes</CardTitle>
            <CardDescription>Success rates by recovery action type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={interventionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" />
                <XAxis 
                  dataKey="type" 
                  stroke="var(--chart-axis)" 
                  tick={{ fill: 'hsl(var(--foreground))', fontSize: 10 }}
                  angle={-15}
                  textAnchor="end"
                  height={80}
                />
                <YAxis stroke="var(--chart-axis)" tick={{ fill: 'hsl(var(--foreground))', fontSize: 11 }} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="success" fill="hsl(var(--primary))" name="Success Rate %" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Note */}
      <Card className="border-dashed glass">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium mb-1">Demo Analytics</p>
              <p className="text-xs text-muted-foreground">
                These insights are based on demonstration data. Real recovery analytics will be available once Phase 2 recovery-agent APIs are implemented and historical data is collected.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
