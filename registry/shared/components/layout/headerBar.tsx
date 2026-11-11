'use client'

import { Link } from "@/lib/router"
import { usePathname } from "@/lib/router"
import { useEffect, useRef, useState, type ReactNode } from "react"
import { useLenis } from "lenis/react"

import Button from "@/components/ui/button"
import MenuButton from "@/components/ui/menuButton"
import Wordmark from "@/components/ui/wordmark"
import { EMAIL } from "@/data/site"
import { HEADER_CTA, HEADER_SOCIAL, NAVIGATION, type NavLink } from "@/data/navigation"
import { HEADER_TEXTS as TEXTS } from "@/data/texts"

const MENU_ID = 'site-menu'

interface HeaderBarProps {
    links?: NavLink[]
    /* logo vlevo — výchozí je Wordmark */
    brand?: ReactNode
    /* null = bez tlačítka */
    cta?: typeof HEADER_CTA | null
    email?: string | null
    social?: NavLink | null
    texts?: Partial<typeof TEXTS>
    /* lišta; mix-blend-difference drží text čitelný na světlém i tmavém pozadí */
    className?: string
    /* vyjíždějící mobilní menu */
    menuClassName?: string
}

export default function HeaderBar({
    links = NAVIGATION,
    brand = <Wordmark className='h-3 w-auto sm:h-3.5' />,
    cta = HEADER_CTA,
    email = EMAIL,
    social = HEADER_SOCIAL,
    texts,
    className = 'bg-transparent px-4 mix-blend-difference',
    menuClassName = 'border-light/15 bg-dark px-6 pt-24 pb-10',
}: HeaderBarProps) {
    const pathname = usePathname()
    const lenis = useLenis()
    const t = { ...TEXTS, ...texts }

    const [isOpen, setIsOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)
    const menuBtnRef = useRef<HTMLButtonElement>(null)
    const wasOpen = useRef(false)

    const [lastPath, setLastPath] = useState(pathname)
    if (lastPath !== pathname) {
        setLastPath(pathname)
        setIsOpen(false)
    }

    useEffect(() => {
        if (!isOpen) return

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false)
        }

        window.addEventListener('keydown', onKeyDown)
        lenis?.stop()

        return () => {
            window.removeEventListener('keydown', onKeyDown)
            lenis?.start()
        }
    }, [isOpen, lenis])

    useEffect(() => {
        if (isOpen) {
            wasOpen.current = true
            menuRef.current?.querySelector('a')?.focus()
        } else if (wasOpen.current) {
            menuBtnRef.current?.focus()
        }
    }, [isOpen])

    return (
        <>
            <header className={`fixed top-0 z-30 flex h-16 w-full items-center justify-between gap-6 font-jet font-bold ${className}`}>
                <Link
                    href='/'
                    aria-label={t.homeLabel}
                    className='shrink-0 text-light transition-opacity duration-300 hover:opacity-70'
                >
                    {brand}
                </Link>

                <nav aria-label={t.navLabel} className='hidden md:block'>
                    <ul className='flex w-fit gap-6 lg:gap-8'>
                        {links.map((link) => {
                            const active = pathname === link.href
                            return (
                                <li
                                    key={link.href}
                                    className='flex cursor-pointer text-[0.7rem] uppercase tracking-[0.15em] text-light'
                                >
                                    <Link
                                        href={link.href}
                                        aria-current={active ? 'page' : undefined}
                                        className={active ? 'underline underline-offset-6' : 'hover:underline hover:underline-offset-6'}
                                    >
                                        {link.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className='flex shrink-0 items-center gap-3'>
                    {cta && <Button href={cta.href} size='sm' className='hidden sm:inline-flex'>{cta.label}</Button>}
                    <MenuButton
                        btnRef={menuBtnRef}
                        onClick={() => setIsOpen(!isOpen)}
                        expanded={isOpen}
                        controls={MENU_ID}
                        className='border-light/30 hover:border-light md:hidden'
                    />
                </div>
            </header>

            <div
                ref={menuRef}
                id={MENU_ID}
                inert={!isOpen}
                aria-label={t.menuLabel}
                className={`fixed top-0 z-20 flex w-full flex-col justify-between gap-10 border-b font-jet md:hidden ${menuClassName}`}
                style={{
                    transform: isOpen ? 'translateY(0)' : 'translateY(-100%)',
                    transition: 'transform 0.7s cubic-bezier(0.76, 0, 0.24, 1)',
                }}
            >
                <nav aria-label={t.navLabel}>
                    <ul className='flex flex-col'>
                        {links.map((link, index) => {
                            const active = pathname === link.href
                            return (
                                <li key={link.href} className='border-b border-light/10'>
                                    <Link
                                        href={link.href}
                                        aria-current={active ? 'page' : undefined}
                                        onClick={() => setIsOpen(false)}
                                        className={`flex items-baseline gap-4 py-4 text-[clamp(2rem,11vw,3.25rem)] leading-none font-black uppercase tracking-[-0.03em] transition-colors duration-300 ${active ? 'text-light' : 'text-light/60 hover:text-light'}`}
                                    >
                                        <span className='text-xs font-bold tracking-[0.2em] text-light/40'>
                                            {String(index + 1).padStart(2, '0')}
                                        </span>
                                        {link.name}
                                    </Link>
                                </li>
                            )
                        })}
                    </ul>
                </nav>

                <div className='flex flex-col gap-4'>
                    {cta && (
                        <Button href={cta.href} variant='solid' className='w-full justify-center'>
                            {cta.mobileLabel}
                        </Button>
                    )}
                    {(email || social) && (
                        <div className='flex items-center justify-between text-xs uppercase tracking-[0.2em] text-light/50'>
                            {email && (
                                <a href={`mailto:${email}`} className='transition-colors hover:text-light'>
                                    {email}
                                </a>
                            )}
                            {social && (
                                <a
                                    href={social.href}
                                    target='_blank'
                                    rel='noreferrer'
                                    className='transition-colors hover:text-light'
                                >
                                    {social.name}
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isOpen && (
                <div
                    aria-hidden
                    onClick={() => setIsOpen(false)}
                    className='fixed inset-0 z-10 cursor-pointer bg-dark/40 md:hidden'
                    style={{ backdropFilter: 'blur(2px)' }}
                />
            )}
        </>
    )
}
