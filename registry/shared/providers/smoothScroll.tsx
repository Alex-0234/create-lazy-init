'use client'

import ReactLenis, { useLenis } from 'lenis/react'
import { useEffect, type ComponentProps, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { setLenis, syncScroll } from '@/lib/scroll'

gsap.registerPlugin(ScrollTrigger)

ScrollTrigger.config({ ignoreMobileResize: true })

/* getLenis / lockScroll / unlockScroll / syncScroll live in @/lib/scroll */

type LenisOptions = NonNullable<ComponentProps<typeof ReactLenis>['options']>

interface SmoothScrollProviderProps {
    children: ReactNode
    /* doplní / přepíše výchozí options níž (autoRaf zůstává vypnutý, tiká GSAP) */
    options?: LenisOptions
}

export default function SmoothScrollProvider({ children, options }: SmoothScrollProviderProps) {
    const lenis = useLenis(ScrollTrigger.update)

    useEffect(() => {
        if (!lenis) return

        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual'
        }
        window.scrollTo(0, 0)
        lenis.scrollTo(0, { immediate: true })

        function update(time: number) {
            lenis?.raf(time * 1000)
        }

        setLenis(lenis)
        gsap.ticker.add(update)
        gsap.ticker.lagSmoothing(0)

        // po každém refreshi ScrollTriggeru (piny mění výšku) srovnat limit Lenisu
        const onRefresh = () => lenis.resize()
        ScrollTrigger.addEventListener('refresh', onRefresh)

        // obsah narostl/zmenšil se (obrázky, lazy sekce, 3D canvas) - debounce + jen při skutečné změně
        let lastHeight = document.body.scrollHeight
        let timer: ReturnType<typeof setTimeout> | undefined
        const observer = new ResizeObserver(() => {
            clearTimeout(timer)
            timer = setTimeout(() => {
                const height = document.body.scrollHeight
                if (height === lastHeight) return
                lastHeight = height
                syncScroll()
            }, 150)
        })
        observer.observe(document.body)

        const onLoad = () => syncScroll()
        if (document.readyState !== 'complete') window.addEventListener('load', onLoad, { once: true })
        document.fonts?.ready.then(syncScroll)

        return () => {
            gsap.ticker.remove(update)
            ScrollTrigger.removeEventListener('refresh', onRefresh)
            window.removeEventListener('load', onLoad)
            observer.disconnect()
            clearTimeout(timer)
            setLenis(null)
        }
    }, [lenis])

    return (
        <ReactLenis
            root
            /* pozor, lerp je obráceně, než se čeká: je to podíl zbývající
               vzdálenosti dojetý za snímek, takže 1 = žádné doskluzování
               a čím níž, tím těžší scroll. 0.1 je výchozí, 0.05 už pořádně klouže */
            /* stopInertiaOnNavigate zabije doskluz při kliknutí na odkaz jinam.
               Bez toho si Lenis po přechodu dojede na starou pozici a nová
               stránka nezačne nahoře - o to víc, čím níž je lerp */
            options={{ lerp: 0.08, stopInertiaOnNavigate: true, ...options, autoRaf: false }}
        >
            {children}
        </ReactLenis>
    )
}
