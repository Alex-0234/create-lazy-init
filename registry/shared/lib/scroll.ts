import type Lenis from 'lenis'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* Scroll helpers usable from anywhere (not only components). The Lenis instance
   is registered by <SmoothScrollProvider>; everything here works without it too. */

let instance: Lenis | null = null
export const getLenis = () => instance

/* only for SmoothScrollProvider */
export function setLenis(lenis: Lenis | null) {
    instance = lenis
    if (lenis && locks > 0) lenis.stop()
}

// zámek scrollu (loading screen, modaly) - drží ho i když Lenis ještě neexistuje
let locks = 0

export function lockScroll() {
    locks++
    document.documentElement.style.overflow = 'hidden'
    instance?.stop()
}

export function unlockScroll() {
    // ignore unbalanced calls, otherwise a stray unlock would release someone else's lock
    if (locks === 0) return
    locks--
    if (locks > 0) return
    document.documentElement.style.overflow = ''
    instance?.start()
    // během zámku se mohla změnit výška stránky (piny, obrázky) - přepočítat
    syncScroll()
}

// Lenis si měří výšku stránky sám a ResizeObserver na <html> nic nezachytí, protože
// <html> má h-full (výška = okno). Bez ručního resize pak Lenis zastaví scroll na
// staré hranici, i když stránka (pin-spacery, obrázky, 3D) mezitím narostla.
export function syncScroll() {
    instance?.resize()
    ScrollTrigger.refresh()
}
