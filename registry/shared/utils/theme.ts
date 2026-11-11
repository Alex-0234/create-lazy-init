import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* barvy, mezi kterými se při scrollu přelévá <html> - přidej vlastní, klíče drž stejné u všech */
export const THEMES = {
    light: { '--background': '#ffffff', '--foreground': '#171717', '--highlight': '#4ade80' },
    dark: { '--background': '#0a0a0a', '--foreground': '#ededed', '--highlight': '#4ade80' },
    inverted: { '--background': '#171717', '--foreground': '#ffffff', '--highlight': '#ffffff' },
}

export type Theme = keyof typeof THEMES

const baseTheme = (): Theme => matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'

let current: Theme | null = null

export function setTheme(theme: Theme, duration = 0.6) {
    current = theme
    return gsap.to(document.documentElement, { ...THEMES[theme], duration, ease: 'power2.inOut', overwrite: 'auto' })
}

export function resetTheme() {
    current = null
    gsap.killTweensOf(document.documentElement)
    Object.keys(THEMES.light).forEach((key) => document.documentElement.style.removeProperty(key))
}

export function themeTrigger(trigger: Element | null, theme: Theme, start = 'top center', end?: string) {
    let previous: Theme
    return ScrollTrigger.create({
        trigger,
        start,
        end,
        onEnter: () => {
            previous = current ?? baseTheme()
            setTheme(theme)
        },
        onLeaveBack: () => setTheme(previous),
        onLeave: end ? () => setTheme(previous) : undefined,
        onEnterBack: end ? () => setTheme(theme) : undefined,
    })
}
