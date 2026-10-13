/**
 * Silueta de montañas y fiordo al pie de la escena: el paisaje nórdico del que viene el nombre.
 * Decorativa (aria-hidden); los colores salen de los tokens de la escena.
 */
export function NordicLandscape() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 1440 220"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-x-0 bottom-0 h-28 w-full sm:h-40"
    >
      <defs>
        <linearGradient id="fiordo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--stage-accent)" stopOpacity="0.14" />
          <stop offset="1" stopColor="var(--stage)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Montañas lejanas */}
      <path
        d="M0 150 L120 92 L210 128 L330 58 L450 120 L560 80 L690 136 L820 70 L930 118 L1050 64 L1170 124 L1290 86 L1440 132 L1440 220 L0 220 Z"
        fill="var(--stage-raised)"
        opacity="0.7"
      />
      {/* Montañas cercanas */}
      <path
        d="M0 182 L90 140 L170 166 L280 118 L400 172 L520 140 L640 178 L760 126 L880 170 L1000 134 L1120 176 L1240 142 L1360 168 L1440 150 L1440 220 L0 220 Z"
        fill="#183450"
      />
      {/* Agua del fiordo */}
      <rect x="0" y="192" width="1440" height="28" fill="url(#fiordo)" />
    </svg>
  )
}
