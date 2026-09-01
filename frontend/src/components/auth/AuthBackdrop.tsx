import { cn } from '@/lib/utils'

interface AuthBackdropProps {
  className?: string
}

/**
 * Refined animated background for auth screens.
 * Multi-layer: base + soft gradient orbs + grid overlay + vignette.
 */
export function AuthBackdrop({ className }: AuthBackdropProps) {
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      {/* Base */}
      <div className="absolute inset-0 bg-[#0a0a12]" />

      {/* Soft ambient orbs */}
      <div
        className="absolute -left-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.06] blur-[120px]"
        style={{ animation: 'orb-drift-1 25s ease-in-out infinite' }}
      />
      <div
        className="absolute -right-24 -top-24 h-[400px] w-[400px] rounded-full bg-blue-500/[0.04] blur-[100px]"
        style={{ animation: 'orb-drift-2 30s ease-in-out infinite' }}
      />
      <div
        className="absolute -bottom-40 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/[0.04] blur-[120px]"
        style={{ animation: 'orb-drift-3 22s ease-in-out infinite' }}
      />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03] [background-image:linear-gradient(to_right,rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:64px_64px]" />

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.5)_100%)]" />
    </div>
  )
}
