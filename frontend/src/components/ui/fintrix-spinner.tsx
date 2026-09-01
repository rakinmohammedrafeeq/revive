import { APP_LOGO_SRC } from '@/config/brandAssets'
import { cn } from '@/lib/utils'

export function LedgeraSpinner({
  size = 40,
  className,
  alt = 'Loading',
}: {
  size?: number
  className?: string
  alt?: string
}) {
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      aria-label={alt}
      role="status"
    >
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-full border-2 border-white/10 border-t-primary/70 animate-spin" />

      {/* App icon */}
      <img
        src={APP_LOGO_SRC}
        alt="Ledgera"
        className="h-[65%] w-[65%] select-none rounded-lg"
        draggable={false}
        loading="eager"
      />
    </div>
  )
}

/** @deprecated Use LedgeraSpinner instead */
export const FintrixSpinner = LedgeraSpinner
