'use client'

import { useEffect, useRef, useState } from 'react'
import { Link } from "@/lib/router"
import { useLenis } from 'lenis/react'

import ContactForm, { type ContactFormTexts } from './contactForm'
import {
    EMAIL, ICO, LEGAL_NOTE, LOCATION, OWNER, PHONE, PHONE_HOURS, PRIVACY_HREF, RESPONSE_TIME,
} from '@/data/site'
import { CONTACT_ANCHOR, NAVIGATION, SOCIALS, type NavLink } from '@/data/navigation'
import { FOOTER_REVEAL_TEXTS } from '@/data/texts'

/* prázdný řetězec = řádek se nevykreslí */
const CONTACT = {
    ico: ICO,
    email: EMAIL,
    responseTime: RESPONSE_TIME,
    phone: PHONE,
    phoneHours: PHONE_HOURS,
}

const TEXTS = {
    ...FOOTER_REVEAL_TEXTS,
    location: LOCATION ? `[ ${LOCATION} ]` : '',
    legalNote: LEGAL_NOTE,
    owner: OWNER,
}

/* Na mobilu bere patička celou obrazovku bez 4rem na fixní hlavičku (h-16) — jinak
   by řádek s navigací skončil pod wordmarkem. Obsah tím dostane maximum místa, takže
   se vejde bez vnitřního scrollu. Od sm: se vrací původní reveal na 70svh, kde výšku
   určuje obsah a max-h ji drží pod viewportem. */
const HEIGHT = 'h-[calc(100svh-4rem)] sm:h-auto sm:min-h-[70svh] sm:max-h-[calc(100svh-4rem)]'

interface FooterRevealProps {
    surface?: 'dark' | 'light'
    height?: string
    nav?: NavLink[]
    socials?: NavLink[]
    contact?: Partial<typeof CONTACT>
    texts?: Partial<typeof TEXTS>
    formTexts?: Partial<ContactFormTexts>
    /* endpoint pro ContactForm, prázdný = mailto: */
    formEndpoint?: string
    privacyHref?: string | null
    /* false = patička bez formuláře */
    showForm?: boolean
    /* id odrážky, na kterou míří odkazy #kotva (spacer nad fixní patičkou) */
    anchorId?: string
    id?: string
    className?: string
}

export default function FooterReveal({
    surface: tone = 'dark',
    height = HEIGHT,
    nav = NAVIGATION,
    socials = SOCIALS,
    contact,
    texts,
    formTexts,
    formEndpoint,
    privacyHref = PRIVACY_HREF,
    showForm = true,
    anchorId = CONTACT_ANCHOR,
    id = 'contact',
    className = '',
}: FooterRevealProps) {
    const lenis = useLenis();
    const onLight = tone === 'light'
    const c = { ...CONTACT, ...contact }
    const t = { ...TEXTS, ...texts }

    const [copied, setCopied] = useState(false)
    const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const footerRef = useRef<HTMLElement>(null)
    const [spacer, setSpacer] = useState<number | null>(null)

    useEffect(() => {
        const el = footerRef.current
        if (!el) return

        const sync = () => setSpacer(el.offsetHeight)
        sync()

        const observer = new ResizeObserver(sync)
        observer.observe(el)

        return () => observer.disconnect()
    }, [])

    useEffect(() => () => {
        if (copyTimer.current) clearTimeout(copyTimer.current)
    }, [])

    const copyIco = async () => {
        try {
            await navigator.clipboard.writeText(c.ico)
        } catch {
            return
        }

        setCopied(true)
        if (copyTimer.current) clearTimeout(copyTimer.current)
        copyTimer.current = setTimeout(() => setCopied(false), 2000)
    }

    /* 99 % krytí, ne plná barva: Safari 26 na iOS barví plochu pod lištami
       podle plně krytého fixního prvku na okraji obrazovky - a to je patička,
       i když leží schovaná pod <main>. Takhle ji přeskočí a vezme pozadí
       stránky. Tmavá na tmavém body vypadá stejně, bílá vyjde na #fdfdfd */
    const surface = onLight ? 'bg-light/99 text-dark' : 'bg-dark/99 text-light'
    const micro = onLight ? 'text-dark/50' : 'text-light/50'
    const body = onLight ? 'text-dark/70' : 'text-light/70'
    const edge = onLight ? 'border-dark/10' : 'border-light/10'
    const hover = onLight ? 'hover:text-dark' : 'hover:text-light'

    /* menší prostrkání na mobilu — s 0.2em se pět odkazů v navigaci nevejde na řádek
       a patička si vezme o řádek víc, než na kolik má místo */
    const microClasses = `font-jet text-xs uppercase tracking-[0.12em] sm:tracking-[0.2em] ${micro}`
    const linkClasses = `transition-colors ${body} ${hover}`

    /* label drží pevný sloupec, aby hodnota nespadla pod něj (flex-wrap ji na mobilu
       zalomil celou, protože se s poznámkou vedle labelu nevešla). Šířka je na nejdelší
       label 'telefon': 7 znaků mono 0.6em + prostrkání = 60,5 px na mobilu, 67 px od sm: */
    const termClasses = `${microClasses} w-[4.25rem] shrink-0 whitespace-nowrap sm:w-20`
    const rowClasses = 'flex items-baseline gap-3'
    const valueClasses = 'flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1'

    const topShadow = onLight
        ? 'shadow-[inset_0_28px_44px_-30px_rgba(23,23,23,0.6)]'
        : 'shadow-[inset_0_28px_44px_-30px_rgba(255,255,255,0.45)]'

    const toTop = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
        if (lenis) lenis.scrollTo(0)
        else window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <>
            <div
                id={anchorId}
                aria-hidden
                style={spacer === null ? undefined : { height: spacer }}
                className={`w-full shrink-0 ${spacer === null ? height : ''}`}
            />

        <footer
            ref={footerRef}
            id={id}
            className={`fixed bottom-0 left-0 z-0 flex w-full flex-col overflow-hidden ${height} ${surface} ${topShadow} font-jet ${className}`}
        >
            <div className={`shrink-0 flex flex-wrap items-center justify-between gap-y-2 border-b px-5 py-2 sm:gap-y-3 sm:px-12 sm:py-5 ${edge}`}>
                <nav aria-label={t.navLabel} className='flex w-full flex-wrap gap-x-2 gap-y-1 sm:w-auto sm:gap-x-3'>
                    {nav.map((item) => (
                        <Link key={item.href} href={item.href} className={`${microClasses} ${hover}`}>
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {t.location && <span className={`hidden sm:inline ${microClasses}`}>{t.location}</span>}
            </div>

            {/* overscroll-contain jen od sm:. Na mobilu je scroll dotykem nativní (Lenis
                má syncTouch: false), takže by contain při přetečení obsahu zastavil chaining
                a prst tažený přes patičku by se v tomhle bloku zasekl - stránka by se dala
                vrátit nahoru jen tahem po horní nebo dolní liště */}
            <div className='flex w-full min-h-0 flex-1 justify-center overflow-y-auto overscroll-y-auto px-5 py-3 sm:overscroll-contain sm:px-12 sm:py-12'>
                <div className='flex w-full max-w-6xl flex-col gap-3 sm:gap-4'>
                    <h2 className='max-w-3xl whitespace-pre-line text-[clamp(1.5rem,5.5vw,3.5rem)] font-black uppercase leading-[1.05] tracking-[-0.042em] sm:leading-[1.1]'>
                        {t.heading}
                    </h2>

                    <div className={`grid grid-cols-1 gap-6 sm:gap-8 lg:gap-16 ${showForm ? 'lg:grid-cols-2' : ''}`}>
                        <div className='flex flex-col gap-2 sm:gap-4'>
                            {t.contactLabel && <p className={`hidden sm:block ${microClasses}`}>{t.contactLabel}</p>}

                            <dl className='flex flex-col gap-1.5 text-sm sm:gap-3'>
                                {c.ico && (
                                    <div className={rowClasses}>
                                        <dt className={termClasses}>{t.icoLabel}</dt>
                                        <dd className={valueClasses}>
                                            <button
                                                type='button'
                                                onClick={copyIco}
                                                title={t.icoCopy}
                                                className={`cursor-pointer underline decoration-dotted underline-offset-4 ${linkClasses}`}
                                            >
                                                {c.ico}
                                            </button>
                                            <span
                                                role='status'
                                                aria-live='polite'
                                                className={`${microClasses} transition-opacity duration-200 ${copied ? 'opacity-100' : 'opacity-0'}`}
                                            >
                                                {copied ? t.icoCopied : ''}
                                            </span>
                                        </dd>
                                    </div>
                                )}
                                {c.email && (
                                    <div className={rowClasses}>
                                        <dt className={termClasses}>{t.emailLabel}</dt>
                                        <dd className={valueClasses}>
                                            <a href={`mailto:${c.email}`} className={`${linkClasses} underline underline-offset-4`}>
                                                {c.email}
                                            </a>
                                            {c.responseTime && <span className={microClasses}>{c.responseTime}</span>}
                                        </dd>
                                    </div>
                                )}
                                {c.phone && (
                                    <div className={rowClasses}>
                                        <dt className={termClasses}>{t.phoneLabel}</dt>
                                        <dd className={valueClasses}>
                                            <a
                                                href={`tel:${c.phone.replace(/\s/g, '')}`}
                                                className={`${linkClasses} underline underline-offset-4`}
                                            >
                                                {c.phone}
                                            </a>
                                            {c.phoneHours && <span className={microClasses}>{c.phoneHours}</span>}
                                        </dd>
                                    </div>
                                )}
                            </dl>

                            {t.legalNote && (
                                <p className={`max-w-md font-jet text-[0.6rem] leading-snug sm:text-[0.65rem] ${micro}`}>
                                    {t.legalNote}
                                </p>
                            )}

                            {socials.length > 0 && (
                                <div className='flex flex-wrap gap-x-4 gap-y-2 text-xs sm:gap-x-6 sm:text-sm'>
                                    {socials.map((item) => (
                                        <a
                                            key={item.href}
                                            href={item.href}
                                            target='_blank'
                                            rel='noreferrer'
                                            className={`group inline-flex items-center gap-2 ${linkClasses}`}
                                        >
                                            {item.name}
                                            <span aria-hidden className='transition-transform duration-300 group-hover:translate-x-1'>
                                                →
                                            </span>
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>

                        {showForm && (
                            <ContactForm
                                email={c.email || undefined}
                                endpoint={formEndpoint}
                                privacyHref={privacyHref}
                                texts={{ subject: t.formSubject, ...formTexts }}
                                variant={tone}
                                showEmailNote={false}
                                compact
                                className='w-full'
                            />
                        )}
                    </div>
                </div>
            </div>

            <div className={`mt-auto shrink-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 border-t px-5 py-2 sm:gap-y-2 sm:px-12 sm:py-3 ${edge}`}>
                <div className='flex flex-wrap items-center gap-x-3 gap-y-1 sm:gap-x-4'>
                    <p className={microClasses}>
                        © {new Date().getFullYear()} {t.owner}
                    </p>
                    {privacyHref && (
                        <Link href={privacyHref} className={`${microClasses} ${hover}`}>
                            {t.privacy}
                        </Link>
                    )}
                </div>
                <a href='#' onClick={toTop} className={`${microClasses} ${hover} cursor-pointer`}>
                    {t.toTop}
                </a>
            </div>
        </footer>
        </>
    )
}
