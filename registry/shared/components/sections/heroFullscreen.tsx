import { Children, type ReactNode } from 'react'
import Button from '@/components/ui/button'
import SectionDivider from '@/components/ui/sectionDivider'
import { HERO_PRIMARY_CTA, HERO_SECONDARY_CTA } from '@/data/navigation'

type Cta = { label: string; href: string }

interface HeroFullscreenProps {
    children: ReactNode
    /* center = děti pod sebou + CTA tlačítka, left = děti vedle sebe */
    align?: 'left' | 'center'
    /* výchozí: tlačítka z data/navigation u center, žádná u left */
    ctas?: Cta[]
    /* lišta dole přes celou šířku, null = bez ní */
    divider?: { start?: ReactNode; end?: ReactNode } | null
    className?: string
}

export default function HeroFullscreen({
    children,
    align = 'left',
    ctas = align === 'center' ? [HERO_PRIMARY_CTA, HERO_SECONDARY_CTA] : [],
    divider = { start: '[ 00 ]', end: 'WELCOME' },
    className = 'bg-yellow-50',
}: HeroFullscreenProps) {
    const items = Children.toArray(children)
    const center = align === 'center'

    return (
        <section className={`relative flex h-screen max-h-screen max-w-full items-center justify-center font-jet ${className}`}>
            {divider && (
                <SectionDivider
                    start={divider.start}
                    end={divider.end}
                    surface='light'
                    className='absolute bottom-8 max-w-[90vw]'
                />
            )}

            <div className={`flex ${center ? 'flex-col' : 'flex-row'}`}>
                {items.map((child, i) => (
                    <div key={i} className='m-2 flex w-full items-center justify-center'>
                        {center ? child : <span className='flex flex-col'>{child}</span>}
                    </div>
                ))}

                {ctas.length > 0 && (
                    <div className='flex w-full flex-col items-center justify-center gap-1 sm:flex-row'>
                        {ctas.map((cta) => (
                            <Button key={cta.href} href={cta.href} variant='solid' size='sm' surface='light'>
                                {cta.label}
                            </Button>
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}
