/* sdílené media queries a rozměry okna - volat jen na klientu (window) */

export const MQ = {
    reducedMotion: '(prefers-reduced-motion: reduce)',
    /* myš / touchpad, ne dotyk */
    finePointer: '(hover: hover) and (pointer: fine)',
} as const

export const matches = (query: string): boolean => window.matchMedia(query).matches

export const prefersReducedMotion = (): boolean => matches(MQ.reducedMotion)

/* užší než px, stejně jako max-* v Tailwindu - použij s matches() */
export const below = (px: number): string => `(width < ${px}px)`;
/* širší nebo rovno px, stejně jako md: / lg: v Tailwindu */
export const above = (px: number): string => `(width >= ${px}px)`;

export const vw = (): number => window.innerWidth
export const vh = (): number => window.innerHeight
