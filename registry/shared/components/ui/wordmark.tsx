import { OWNER } from '@/data/site'

const TEXT = OWNER.toUpperCase()

// SVG podpis do headeru — text je vysázený v JetBrains Mono (monospace = předvídatelná šířka),
// viewBox je spočítaný z advance width 0.6em, takže SVG má pevný poměr stran a stačí mu zadat výšku.
// Při fontSize 100 je to 60 jednotek na znak + 6 prostrkání.
const ADVANCE = 66

interface WordmarkProps {
    text?: string
    /* čtvereček za textem */
    dot?: boolean
    className?: string
}

export default function Wordmark({ text = TEXT, dot = true, className = '' }: WordmarkProps) {
    if (!text) return null

    const textWidth = text.length * ADVANCE
    const dotX = textWidth + 14
    const width = dot ? dotX + 26 : textWidth

    return (
        <svg
            viewBox={`0 0 ${width} 120`}
            preserveAspectRatio='xMinYMid meet'
            role='img'
            aria-label={text}
            className={className}
        >
            <text
                x='0'
                y='100'
                fill='currentColor'
                letterSpacing='6'
                fontSize='100'
                fontWeight='700'
                className='font-jet'
            >
                {text}
            </text>
            {dot && <rect x={dotX} y='88' width='12' height='12' fill='currentColor' />}
        </svg>
    )
}
