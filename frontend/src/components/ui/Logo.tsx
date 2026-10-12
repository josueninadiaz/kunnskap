import { config } from '../../lib/config'

/** Marca: monograma «K» en trazo aurora sobre fondo de escena, y el nombre configurable. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 font-display font-semibold tracking-[-0.02em] ${className}`}>
      <svg viewBox="0 0 32 32" aria-hidden="true" className="size-7 shrink-0">
        <rect width="32" height="32" rx="8" fill="var(--stage)" />
        <path
          d="M10 8v16M10 16.5 20.5 8M13.8 13.6 21.5 24"
          fill="none"
          stroke="var(--stage-accent)"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="text-[1.0625rem]">{config.platformName}</span>
    </span>
  )
}
