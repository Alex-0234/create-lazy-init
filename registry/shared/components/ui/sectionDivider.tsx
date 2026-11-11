import type { ReactNode } from 'react'

/* hlavička sekce přes celou šířku: TEXT1 ——————— TEXT2
   čára mezi texty (flex-1) vyplní, co zbyde */

interface SectionDividerProps {
    /* levý text, např. '[ 01 ]' */
    start?: ReactNode
    /* pravý text, např. 'služby' */
    end?: ReactNode
    /* text uprostřed čáry - čára se rozdělí na dvě půlky */
    middle?: ReactNode
    line?: 'solid' | 'dashed' | 'dotted' | 'none'
    surface?: 'dark' | 'light'
    /* id pro odkazy #kotva */
    id?: string
    /* obal - výchozí je padding a mezera stejně jako patička */
    className?: string
    /* oba texty */
    textClassName?: string
    /* čára - tloušťka, barva, odsazení od textu */
    lineClassName?: string
}

const LINE = {
    solid: 'border-solid',
    dashed: 'border-dashed',
    dotted: 'border-dotted',
    none: 'border-transparent',
}

export default function SectionDivider({
    start,
    end,
    middle,
    line = 'solid',
    surface = 'light',
    id,
    className = 'px-5 py-6 sm:px-12 sm:py-10',
    textClassName = 'text-xs uppercase tracking-[0.12em] sm:tracking-[0.2em]',
    lineClassName = '',
}: SectionDividerProps) {
    const onLight = surface === 'light'
    const text = onLight ? 'text-dark/50' : 'text-light/50'
    const edge = onLight ? 'border-dark/15' : 'border-light/15'

    const rule = (
        <span aria-hidden className={`h-0 min-w-4 flex-1 border-t ${LINE[line]} ${line === 'none' ? '' : edge} ${lineClassName}`} />
    )

    return (
        <div id={id} className={`flex w-full items-center gap-3 font-jet sm:gap-4 ${className}`}>
            {start !== undefined && <span className={`shrink-0 whitespace-nowrap ${text} ${textClassName}`}>{start}</span>}
            {rule}
            {middle !== undefined && (
                <>
                    <span className={`shrink-0 whitespace-nowrap ${text} ${textClassName}`}>{middle}</span>
                    {rule}
                </>
            )}
            {end !== undefined && <span className={`shrink-0 whitespace-nowrap ${text} ${textClassName}`}>{end}</span>}
        </div>
    )
}
