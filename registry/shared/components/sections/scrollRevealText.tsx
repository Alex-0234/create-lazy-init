'use client'

import { useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, SplitText)

interface ScrollRevealTextProps {
    children: string
    /* sekce - výška určuje, jak dlouho se text při scrollu odhaluje */
    className?: string
    textClassName?: string
    /* krytí znaků před odhalením */
    from?: number
}

/* text se při scrollu rozsvěcí znak po znaku (scrub) */
export default function ScrollRevealText({
    children,
    className = 'flex min-h-screen w-full items-center px-6 py-32 sm:px-12',
    textClassName = 'max-w-5xl text-[clamp(1.75rem,5vw,4rem)] font-semibold leading-[1.1] tracking-tight',
    from = 0.15,
}: ScrollRevealTextProps) {
    const sectionRef = useRef<HTMLElement>(null)
    const textRef = useRef<HTMLParagraphElement>(null)

    useGSAP(() => {
        SplitText.create(textRef.current, {
            type: 'words,chars',
            autoSplit: true,
            onSplit(self) {
                return gsap.fromTo(self.chars,
                    { opacity: from },
                    {
                        opacity: 1,
                        ease: 'none',
                        stagger: 0.1,
                        scrollTrigger: {
                            trigger: sectionRef.current,
                            start: 'top 90%',
                            end: 'bottom 90%',
                            scrub: true,
                        },
                    })
            },
        })
    }, { scope: sectionRef })

    return (
        <section ref={sectionRef} className={className}>
            <p ref={textRef} className={textClassName}>
                {children}
            </p>
        </section>
    )
}
