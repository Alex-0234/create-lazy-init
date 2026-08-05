'use client'

import ReactLenis, { type LenisRef } from 'lenis/react'
import { useRef, type ReactNode } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger)

ScrollTrigger.config({ ignoreMobileResize: true })

type LenisInstance = NonNullable<LenisRef['lenis']>

let instance: LenisInstance | null = null
export const getLenis = () => instance

export default function LenisSetup({ children }: { children: ReactNode }) {
  const lenisRef = useRef<LenisRef>(null)

  useGSAP(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.scrollTo(0, 0)
    lenisRef.current?.lenis?.scrollTo(0, { immediate: true })

    function update(time: number) {
      lenisRef.current?.lenis?.raf(time * 1000)
    }

    instance = lenisRef.current?.lenis ?? null
    lenisRef.current?.lenis?.on('scroll', ScrollTrigger.update)
    gsap.ticker.add(update)
    gsap.ticker.lagSmoothing(0)

    document.fonts?.ready.then(() => ScrollTrigger.refresh())

    return () => {
      lenisRef.current?.lenis?.off('scroll', ScrollTrigger.update)
      gsap.ticker.remove(update)
      instance = null
    }
  }, [])

  return (
    <ReactLenis root ref={lenisRef} options={{ lerp: 0.4, autoRaf: false }}>
      {children}
    </ReactLenis>
  )
}
