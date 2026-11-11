'use client'

import { useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import Wordmark from '@/components/ui/wordmark'
import { prefersReducedMotion } from '@/utils/viewport'
import { markLoaderDone } from '@/utils/loader'
import { lockScroll, unlockScroll } from '@/lib/scroll'

// jednou za relaci - po přechodu mezi stránkami nebo refreshi se znovu nespustí
const SEEN_KEY = 'app:loader-seen'

const seen = (): boolean => {
    try {
        return sessionStorage.getItem(SEEN_KEY) === '1'
    } catch {
        return false
    }
}

const markSeen = () => {
    try {
        sessionStorage.setItem(SEEN_KEY, '1')
    } catch {
        // storage blocked (private mode) - the loader just plays again next time
    }
}

interface LoadingScreenProps {
    /* logo nad počítadlem - výchozí je Wordmark, null = jen počítadlo */
    logo?: ReactNode
    duration?: number
}

export default function LoadingScreen({
    logo = <Wordmark className='h-auto w-full' />,
    duration = 1.8,
}: LoadingScreenProps) {
    const [done, setDone] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const countRef = useRef<HTMLSpanElement>(null)
    const barRef = useRef<HTMLDivElement>(null)

    useGSAP(() => {
        if (seen()) {
            markLoaderDone()
            setDone(true)
            return
        }

        // dokud overlay běží, stránka pod ním nescrolluje (zastaví i Lenis)
        lockScroll()
        let unlocked = false
        const unlock = () => {
            if (unlocked) return
            unlocked = true
            unlockScroll()
        }

        const finish = () => {
            unlock()
            markLoaderDone()
            markSeen()
            setDone(true)
        }

        if (prefersReducedMotion()) {
            gsap.to(rootRef.current, { autoAlpha: 0, duration: 0.3, delay: 0.4, onComplete: finish })
            return unlock
        }

        const counter = { value: 0 }
        const tl = gsap.timeline({ onComplete: finish })

        tl.from('[data-loader-logo]', { yPercent: 40, autoAlpha: 0, duration: 0.8, ease: 'power3.out' })
            .to(counter, {
                value: 100,
                duration,
                ease: 'power2.inOut',
                onUpdate: () => {
                    if (countRef.current) countRef.current.textContent = String(Math.round(counter.value)).padStart(3, '0')
                },
            }, '<')
            .to(barRef.current, { scaleX: 1, duration, ease: 'power2.inOut' }, '<')
            .to('[data-loader-content]', { autoAlpha: 0, y: -20, duration: 0.4, ease: 'power2.in' })
            .to(rootRef.current, { yPercent: -100, duration: 0.9, ease: 'expo.inOut' }, '-=0.1')
            // intro stránky startuje, když overlay začne odjíždět - ne až po něm
            .call(markLoaderDone, [], '<0.15')

        return unlock
    }, { scope: rootRef })

    if (done) return null

    return (
        <div
            ref={rootRef}
            aria-hidden
            className="fixed inset-0 z-100 flex items-center justify-center bg-dark text-light"
        >
            <div data-loader-content className="flex w-2/3 max-w-sm flex-col items-center gap-8 md:w-1/3">
                <div data-loader-logo className="w-full">{logo}</div>
                <div className="flex w-full items-center gap-4 font-jet text-xs tracking-[0.2em]">
                    <div className="h-px flex-1 bg-light/20">
                        <div ref={barRef} className="h-full origin-left scale-x-0 bg-light" />
                    </div>
                    <span ref={countRef} className="tabular-nums">000</span>
                </div>
            </div>
        </div>
    )
}
