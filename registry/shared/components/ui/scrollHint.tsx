'use client'

import { useEffect, useState } from 'react'
import { useLenis } from 'lenis/react'
import { vh } from '@/utils/viewport'
import { SCROLL_HINT_TEXT as LABEL } from '@/data/texts'

// jakmile je do konce stránky míň než tolik obrazovek, nápověda odjede.
// vztažené k výšce okna, ať to sedí i na patičce - ta je na mobilu vysoká
// 100svh-4rem (~0,93 svh) a na desktopu 0,7-0,93 svh, takže celá obrazovka
// nápovědu schová přesně ve chvíli, kdy se patička začne odhalovat
const HIDE_WITHIN_SCREENS = 1

interface ScrollHintProps {
    label?: string
    hideWithinScreens?: number
    className?: string
}

export default function ScrollHint({
    label = LABEL,
    hideWithinScreens = HIDE_WITHIN_SCREENS,
    className = 'bottom-10 text-white mix-blend-difference',
}: ScrollHintProps) {
    const [hidden, setHidden] = useState(false)

    // stejná hodnota nevyvolá re-render, takže to může běžet při každém scrollu
    const lenis = useLenis(({ scroll, limit }) => {
        setHidden(limit - scroll < vh() * hideWithinScreens)
    })

    // bez Lenisu (komponenta mimo LenisSetup) posloucháme nativní scroll
    useEffect(() => {
        if (lenis) return

        const onScroll = () => {
            const limit = document.documentElement.scrollHeight - vh()
            setHidden(limit - window.scrollY < vh() * hideWithinScreens)
        }
        onScroll()
        window.addEventListener('scroll', onScroll, { passive: true })
        return () => window.removeEventListener('scroll', onScroll)
    }, [lenis, hideWithinScreens])

    return (
        <div
            aria-hidden
            className={`pointer-events-none fixed z-5 flex w-full justify-center font-jet transition-opacity duration-500 ${
                hidden ? 'opacity-0' : 'opacity-100'
            } ${className}`}
        >
            <span>{label}</span>
        </div>
    )
}
