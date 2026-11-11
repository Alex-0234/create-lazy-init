'use client'

import { useRef, type ComponentProps } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import FramedImage from '@/components/ui/framedImage'
import type { Image } from '@/lib/image'

gsap.registerPlugin(ScrollTrigger)

const SLOW_RANGE = 1400
const SLOW_TRAVEL = Math.round(SLOW_RANGE * (2 / Math.PI))
const GROW_SHARE = 0.6
const IMAGE_OVERSCAN = 15
const IMAGE_SHIFT = 10

type GrowingImageProps = ComponentProps<'div'> & {
    src: ComponentProps<typeof Image>['src']
    alt?: string
    /* rámeček před roztažením na celou šířku */
    frameClassName?: string
}

/* obrázek v zaobleném rámečku, který se při scrollu roztáhne přes celou obrazovku
   a obsah (children) nad ním pomaleji dojíždí */
export default function GrowingImage({
    src,
    alt = '',
    frameClassName = 'h-120 w-220 max-w-[90%] rounded-[120px]',
    children,
    className = '',
    style,
    ...props
}: GrowingImageProps) {
    const sectionRef = useRef<HTMLDivElement>(null)
    const contentRef = useRef<HTMLDivElement>(null)
    const imageWrapperRef = useRef<HTMLDivElement>(null)
    const imageRef = useRef<HTMLImageElement>(null)

    useGSAP(() => {
        gsap.timeline({
            scrollTrigger: {
                trigger: sectionRef.current,
                start: 'top 100%',
                end: 'bottom 25%',
                scrub: true,
                invalidateOnRefresh: true,
            },
        })
            .to(contentRef.current, { y: SLOW_TRAVEL, duration: 1, ease: 'sine.inOut' }, 0)
            .to(imageWrapperRef.current, {
                width: '100%',
                height: '100%',
                maxWidth: '100%',
                borderRadius: 0,
                duration: GROW_SHARE,
                ease: 'power1.in',
            }, 0)
            .fromTo(imageRef.current,
                { yPercent: -IMAGE_SHIFT },
                { yPercent: IMAGE_SHIFT, duration: 1, ease: 'none' },
                0)

        gsap.fromTo(imageRef.current, { filter: 'blur(0px)' }, {
            filter: 'blur(8px)',
            duration: 0.6,
            ease: 'power2.out',
            scrollTrigger: {
                trigger: sectionRef.current,
                start: 'bottom 25%',
                toggleActions: 'play none none reverse',
            },
        })
    }, { scope: sectionRef })

    return (
        <div
            ref={sectionRef}
            className={`overflow-hidden ${className}`}
            style={{ height: `calc(100vh + ${SLOW_TRAVEL}px)`, ...style }}
            {...props}
        >
            <div ref={contentRef} className='flex w-full h-screen justify-center items-center will-change-transform'>
                <FramedImage
                    frameRef={imageWrapperRef}
                    imageRef={imageRef}
                    overscan={IMAGE_OVERSCAN}
                    frameClassName={frameClassName}
                    src={src}
                    alt={alt}
                >
                    {children}
                </FramedImage>
            </div>
        </div>
    )
}
