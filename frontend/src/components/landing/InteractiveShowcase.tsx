import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Users, ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react'

export function InteractiveShowcase() {
  const [mounted, setMounted] = useState(false)
  const [activeCard, setActiveCard] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Animated stats
  const stats = [
    {
      label: 'Total Revenue',
      value: '$124,592',
      change: '+12.5%',
      trend: 'up' as const,
      icon: DollarSign,
      color: 'emerald',
    },
    {
      label: 'Active Users',
      value: '2,847',
      change: '+8.2%',
      trend: 'up' as const,
      icon: Users,
      color: 'blue',
    },
    {
      label: 'Expenses',
      value: '$48,293',
      change: '-3.1%',
      trend: 'down' as const,
      icon: Activity,
      color: 'amber',
    },
  ]

  // Chart data points for sparkline
  const chartData = [
    { month: 'Jan', value: 45 },
    { month: 'Feb', value: 52 },
    { month: 'Mar', value: 48 },
    { month: 'Apr', value: 61 },
    { month: 'May', value: 55 },
    { month: 'Jun', value: 67 },
    { month: 'Jul', value: 72 },
  ]

  const maxValue = Math.max(...chartData.map(d => d.value))
  const chartHeight = 120

  return (
    <div className="relative">
      {/* Ambient glow effects */}
      <div className="pointer-events-none absolute -inset-4 opacity-0 transition-opacity duration-1000" style={{ opacity: mounted ? 0.6 : 0 }}>
        <div className="absolute left-1/4 top-0 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
        <div className="absolute bottom-0 right-1/4 h-48 w-48 rounded-full bg-amber-500/10 blur-[80px]" />
      </div>

      <div className="relative space-y-4">
        {/* Stats Grid */}
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map((stat, index) => {
            const Icon = stat.icon
            const isActive = activeCard === index
            
            return (
              <div
                key={stat.label}
                onMouseEnter={() => setActiveCard(index)}
                onMouseLeave={() => setActiveCard(null)}
                className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
                style={{
                  animation: mounted ? `slide-up ${300 + index * 100}ms ease-out both` : 'none',
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                
                {/* Glow on hover */}
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                )}

                <div className="relative space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br transition-all duration-300 ${
                      stat.color === 'emerald' 
                        ? 'from-emerald-500/20 to-emerald-600/10 group-hover:from-emerald-500/30 group-hover:to-emerald-600/20' 
                        : stat.color === 'blue'
                        ? 'from-blue-500/20 to-blue-600/10 group-hover:from-blue-500/30 group-hover:to-blue-600/20'
                        : 'from-amber-500/20 to-amber-600/10 group-hover:from-amber-500/30 group-hover:to-amber-600/20'
                    }`}>
                      <Icon className={`h-5 w-5 transition-colors ${
                        stat.color === 'emerald' 
                          ? 'text-emerald-400' 
                          : stat.color === 'blue'
                          ? 'text-blue-400'
                          : 'text-amber-400'
                      }`} />
                    </div>
                    
                    <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      stat.trend === 'up'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      {stat.trend === 'up' ? (
                        <ArrowUpRight className="h-3 w-3" />
                      ) : (
                        <ArrowDownRight className="h-3 w-3" />
                      )}
                      {stat.change}
                    </div>
                  </div>

                  <div>
                    <div className="text-2xl font-bold text-white transition-all duration-300 group-hover:text-primary">
                      {stat.value}
                    </div>
                    <div className="text-xs text-white/40">{stat.label}</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Chart Panel */}
        <div
          className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-6 backdrop-blur-xl transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10"
          style={{
            animation: mounted ? 'slide-up 600ms ease-out both' : 'none',
          }}
        >
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/[0.05] to-transparent transition-transform duration-1000 group-hover:translate-x-full" />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-white/80">Revenue Overview</h3>
                <p className="text-xs text-white/40">Last 7 months</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">+24.3%</span>
              </div>
            </div>

            {/* Sparkline Chart */}
            <div className="relative" style={{ height: chartHeight }}>
              {/* Grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="h-px w-full bg-white/[0.03]" />
                ))}
              </div>

              {/* Chart */}
              <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="rgb(99, 102, 241)" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="rgb(99, 102, 241)" />
                    <stop offset="50%" stopColor="rgb(168, 85, 247)" />
                    <stop offset="100%" stopColor="rgb(236, 72, 153)" />
                  </linearGradient>
                </defs>

                {/* Area */}
                <path
                  d={`
                    M 0 ${chartHeight}
                    ${chartData.map((d, i) => {
                      const x = (i / (chartData.length - 1)) * 100
                      const y = chartHeight - (d.value / maxValue) * chartHeight
                      return `L ${x}% ${y}`
                    }).join(' ')}
                    L 100% ${chartHeight}
                    Z
                  `}
                  fill="url(#chartGradient)"
                  className="transition-all duration-500"
                />

                {/* Line */}
                <path
                  d={chartData.map((d, i) => {
                    const x = (i / (chartData.length - 1)) * 100
                    const y = chartHeight - (d.value / maxValue) * chartHeight
                    return `${i === 0 ? 'M' : 'L'} ${x}% ${y}`
                  }).join(' ')}
                  fill="none"
                  stroke="url(#lineGradient)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500"
                  style={{
                    filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))',
                  }}
                />

                {/* Data points */}
                {chartData.map((d, i) => {
                  const x = (i / (chartData.length - 1)) * 100
                  const y = chartHeight - (d.value / maxValue) * chartHeight
                  return (
                    <g key={i}>
                      <circle
                        cx={`${x}%`}
                        cy={y}
                        r="4"
                        fill="rgb(99, 102, 241)"
                        className="transition-all duration-300 hover:r-6"
                        style={{
                          filter: 'drop-shadow(0 0 6px rgba(99, 102, 241, 0.8))',
                        }}
                      />
                      <circle
                        cx={`${x}%`}
                        cy={y}
                        r="2"
                        fill="white"
                      />
                    </g>
                  )
                })}
              </svg>

              {/* Month labels */}
              <div className="absolute -bottom-6 left-0 right-0 flex justify-between px-1">
                {chartData.map((d, i) => (
                  <span key={i} className="text-[10px] text-white/30">
                    {d.month}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>


      </div>
    </div>
  )
}
