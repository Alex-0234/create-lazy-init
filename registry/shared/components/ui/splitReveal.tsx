'use client'

import { useRef } from "react"
import gsap from "gsap"
import { SplitText } from "gsap/SplitText"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { below, matches, prefersReducedMotion } from "@/utils/viewport"

gsap.registerPlugin(SplitText, ScrollTrigger)

// text je do spuštění animace schovaný, ať neproblikne v konečné podobě
const HIDDEN = { visibility: 'hidden' } as const

type Tag = 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'span' | 'div'

interface SplitRevealProps {
    children: string
    ref?: React.Ref<HTMLElement>
    as?: Tag
    className?: string
    split?: 'lines' | 'words' | 'chars'
    stagger?: number
    duration?: number
    ease?: string
    delay?: number
    on?: 'scroll' | 'mount'
    start?: string
    /* šířka v px, pod kterou se text místo rozsekání jen prolne */
    disableBelow?: number
    onReady?: (tl: gsap.core.Timeline) => void
}

export default function SplitReveal({
    children,
    ref,
    as: Tag = 'p',
    className = '',
    split = 'lines',
    stagger = 0.08,
    duration = 0.8,
    ease = 'power3.out',
    delay = 0,
    on = 'scroll',
    start = 'top 85%',
    disableBelow,
    onReady,
}: SplitRevealProps) {
    const elRef = useRef<HTMLElement>(null)

    // the parent may want the element itself (to position or animate it) while
    // we still need it internally for SplitText - feed both from one callback
    const attachRef = (node: HTMLElement | null) => {
        elRef.current = node
        if (typeof ref === 'function') {
            ref(node)
        } else if (ref) {
            ref.current = node
        }
    }

    useGSAP(() => {
        if (!elRef.current) return

        const reduced = prefersReducedMotion()
        const tooNarrow = disableBelow !== undefined && matches(below(disableBelow))

        if (reduced || tooNarrow) {
            const tl = gsap.timeline({
                paused: !!onReady,
                delay,
                scrollTrigger: onReady || on === 'mount' ? undefined : {
                    trigger: elRef.current,
                    start,
                    once: true,
                },
            })

            tl.set(elRef.current, { visibility: 'visible' }, 0)

            if (!reduced) {
                tl.fromTo(elRef.current, {
                    opacity: 0,
                }, {
                    opacity: 1,
                    duration,
                    ease,
                }, 0)
            }

            onReady?.(tl)
            return
        }

        SplitText.create(elRef.current, {
            type: split,
            // wraps every piece in its own overflow:clip element, so the text
            // slides up out of nothing instead of appearing mid-air
            mask: split,
            // re-measure lines once webfonts land - but not when a parent owns
            // the timeline, since it would be holding a reference to the old one
            autoSplit: !onReady,
            onSplit: (self) => {
                const tl = gsap.timeline({
                    paused: !!onReady,
                    delay,
                    // no scrollTrigger means it just plays on creation, which
                    // for a layout effect is "as soon as it renders"
                    scrollTrigger: onReady || on === 'mount' ? undefined : {
                        trigger: elRef.current,
                        start,
                        once: true,
                    },
                    // po dojetí split zahodíme a text se vrátí do původní podoby.
                    // masky mají overflow: clip a jsou vysoké přesně jako znak, takže
                    // by při těsném leadingu natrvalo uřízly háčky nad em boxem;
                    // zbylé transformy navíc rasterizují znaky ve vlastní vrstvě
                    // a ty pak sedí o pixel jinak než okolní text.
                    // timeline, kterou řídí rodič, si musí zůstat rozdělená
                    onComplete: onReady ? undefined : () => {
                        gsap.delayedCall(0, () => self.revert())
                    },
                })

                tl.set(elRef.current, { visibility: 'visible' }, 0)

                tl.from(self[split], {
                    // 100 would park the text exactly one line-box down, which
                    // leaves czech diacritics (Ý Á Ě Ř) poking above the mask
                    // since they sit outside the em box. the overshoot hides them.
                    yPercent: 115,
                    duration,
                    stagger,
                    ease,
                }, 0)

                onReady?.(tl)
                // returning it lets SplitText carry the playhead across re-splits
                return tl
            },
        })
    }, [])

    return (
        <Tag ref={attachRef} className={className} style={HIDDEN}>
            {children}
        </Tag>
    )
}
