'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, usePathname } from '@/lib/router'
import MenuButton from '@/components/ui/menuButton'
import Wordmark from '@/components/ui/wordmark'
import { HEADER_CTA, NAVIGATION, type NavLink } from '@/data/navigation'
import { HEADER_TEXTS as TEXTS } from '@/data/texts'

/* plovoucí hlavička: logo vlevo, vpravo zaoblená lišta s odkazy (desktop)
   nebo s CTA a hamburgerem, pod kterým vyjede menu (mobil) */

const MENU_ID = 'floating-menu'
const BAR = 'pointer-events-auto flex items-center gap-1 rounded-lg border border-light/10 bg-dark/70 p-1 font-jet text-[0.7rem] uppercase tracking-[0.15em] text-light backdrop-blur-md'
const ITEM = 'shrink-0 px-4 py-2 rounded-md transition-colors duration-300'
const CTA = `${ITEM} bg-highlight text-light hover:bg-light hover:text-dark`

interface HeaderFloatingProps {
    links?: NavLink[]
    /* logo vlevo — výchozí je Wordmark */
    brand?: ReactNode
    /* null = bez tlačítka */
    cta?: typeof HEADER_CTA | null
    texts?: Partial<typeof TEXTS>
    className?: string
}

export default function HeaderFloating({
    links = NAVIGATION,
    brand = <Wordmark className='h-3 w-auto sm:h-3.5' />,
    cta = HEADER_CTA,
    texts,
    className = '',
}: HeaderFloatingProps) {
    const pathname = usePathname()
    const t = { ...TEXTS, ...texts }
    const [open, setOpen] = useState(false)
    const menuWrapRef = useRef<HTMLDivElement>(null)

    const [lastPath, setLastPath] = useState(pathname)
    if (lastPath !== pathname) {
        setLastPath(pathname)
        setOpen(false)
    }

    useEffect(() => {
        if (!open) return
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false)
        }
        // klik mimo lištu a menu ho zavře
        const onPointerDown = (e: PointerEvent) => {
            if (!menuWrapRef.current?.contains(e.target as Node)) setOpen(false)
        }
        window.addEventListener('keydown', onKeyDown)
        document.addEventListener('pointerdown', onPointerDown)
        return () => {
            window.removeEventListener('keydown', onKeyDown)
            document.removeEventListener('pointerdown', onPointerDown)
        }
    }, [open])

    const linkClass = (href: string) =>
        `${ITEM} ${pathname === href ? 'bg-light text-dark' : 'text-light/70 hover:bg-light/10 hover:text-light'}`

    return (
        <header className={`pointer-events-none fixed top-3 right-3 left-3 z-50 flex items-center justify-between gap-3 sm:top-4 sm:right-4 sm:left-4 ${className}`}>
            <Link
                href='/'
                aria-label={t.homeLabel}
                className='pointer-events-auto shrink-0 text-foreground transition-opacity duration-300 hover:opacity-80'
            >
                {brand}
            </Link>

            <nav aria-label={t.navLabel} className={`${BAR} hidden md:flex`}>
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        aria-current={pathname === link.href ? 'page' : undefined}
                        className={linkClass(link.href)}
                    >
                        {link.name}
                    </Link>
                ))}
                {cta && <Link href={cta.href} className={CTA}>{cta.label}</Link>}
            </nav>

            <div ref={menuWrapRef} className='relative md:hidden'>
                <div className={BAR}>
                    {cta && <Link href={cta.href} className={CTA}>{cta.mobileLabel}</Link>}
                    <MenuButton
                        onClick={() => setOpen(!open)}
                        expanded={open}
                        controls={MENU_ID}
                        className='rounded-md border-transparent hover:bg-light/10'
                    />
                </div>

                <nav
                    id={MENU_ID}
                    aria-label={t.menuLabel}
                    inert={!open}
                    className={`${BAR} absolute top-full right-0 mt-2 w-[min(16rem,calc(100vw-1.5rem))] flex-col items-stretch transition-all duration-300 ${open ? 'translate-y-0 opacity-100' : 'pointer-events-none! -translate-y-2 opacity-0'}`}
                >
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            aria-current={pathname === link.href ? 'page' : undefined}
                            onClick={() => setOpen(false)}
                            className={`${linkClass(link.href)} py-3`}
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>
            </div>
        </header>
    )
}
