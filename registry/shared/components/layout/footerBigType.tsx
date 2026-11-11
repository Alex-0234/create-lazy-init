import type { ReactNode } from 'react'
import { Link } from '@/lib/router'
import { HEADER_CTA, NAVIGATION, SOCIALS, type NavLink } from '@/data/navigation'
import { EMAIL, OWNER, PRIVACY_HREF } from '@/data/site'
import { FOOTER_BIG_TYPE_TEXTS as TEXTS } from '@/data/texts'

/* patička se čtyřmi sloupci a obřím slovem, které vyčnívá přes spodní okraj */

const LABEL = 'font-jet text-[0.7rem] uppercase tracking-[0.15em] text-dark/50'
const LINK = 'w-fit transition-colors duration-300 hover:text-highlight'

/* velikost slova v vw podle počtu znaků, ať se vejde na šířku - 6 znaků ≈ 21vw */
const wordSize = (word: string) => Math.min(21, 126 / Math.max(word.length, 1))

interface FooterBigTypeProps {
    /* obří slovo dole, prázdné = bez něj */
    word?: string
    nav?: NavLink[]
    socials?: NavLink[]
    cta?: typeof HEADER_CTA | null
    email?: string
    owner?: string
    privacyHref?: string | null
    texts?: Partial<typeof TEXTS>
    /* plocha patičky */
    className?: string
    /* barva obřího slova */
    wordClassName?: string
    children?: ReactNode
}

export default function FooterBigType({
    word = OWNER,
    nav = NAVIGATION,
    socials = SOCIALS,
    cta = HEADER_CTA,
    email = EMAIL,
    owner = OWNER,
    privacyHref = PRIVACY_HREF,
    texts,
    className = 'bg-highlight text-dark',
    wordClassName = 'text-dark/15',
    children,
}: FooterBigTypeProps) {
    const t = { ...TEXTS, ...texts }
    const size = wordSize(word)

    return (
        <footer className='relative flex min-h-svh w-full items-end justify-center overflow-hidden'>
            <div
                className={`relative flex min-h-[87.5svh] w-full flex-col justify-between gap-12 overflow-hidden rounded-t-2xl px-6 pt-12 sm:px-12 sm:pt-16 ${className}`}
                /* místo pro slovo, aby nepřekrylo obsah */
                style={{ paddingBottom: word ? `${size + 1}vw` : undefined }}
            >
                <div className='grid gap-10 sm:grid-cols-2 lg:grid-cols-4'>
                    <div className='flex flex-col gap-4'>
                        {t.headline && <p className='text-3xl font-black uppercase leading-none'>{t.headline}</p>}
                        {t.tagline && <p className='max-w-60 opacity-70'>{t.tagline}</p>}
                    </div>

                    <nav aria-label={t.navLabel} className='flex flex-col gap-2'>
                        <span className={LABEL}>{t.navLabel}</span>
                        {nav.map((link) => (
                            <Link key={link.href} href={link.href} className={`text-lg font-bold uppercase ${LINK}`}>
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    <div className='flex flex-col gap-2'>
                        {email && (
                            <>
                                <span className={LABEL}>{t.contactLabel}</span>
                                <a href={`mailto:${email}`} className={`text-lg font-bold ${LINK}`}>{email}</a>
                            </>
                        )}
                        {socials.length > 0 && (
                            <div className='mt-4 flex flex-col gap-2'>
                                <span className={LABEL}>{t.socialsLabel}</span>
                                {socials.map((item) => (
                                    <a key={item.href} href={item.href} target='_blank' rel='noreferrer' className={`text-lg font-bold ${LINK}`}>
                                        {item.name}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>

                    {cta && (
                        <div className='flex flex-col items-start gap-4'>
                            <span className={LABEL}>{t.ctaLabel}</span>
                            {t.ctaText && <p className='opacity-70'>{t.ctaText}</p>}
                            <Link
                                href={cta.href}
                                className='rounded-md bg-dark px-5 py-3 font-jet text-[0.7rem] uppercase tracking-[0.15em] text-light transition-colors duration-300 hover:bg-light hover:text-dark'
                            >
                                {cta.label} →
                            </Link>
                        </div>
                    )}
                </div>

                {children}

                <div className={`flex flex-wrap justify-between gap-4 border-t border-dark/10 pt-4 ${LABEL}`}>
                    <span>© {new Date().getFullYear()} {owner}</span>
                    {privacyHref && (
                        <Link href={privacyHref} className='transition-colors duration-300 hover:text-dark'>
                            {t.privacy}
                        </Link>
                    )}
                </div>

                {word && (
                    <span
                        aria-hidden
                        className={`pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/6 select-none whitespace-nowrap font-bold uppercase leading-none tracking-tighter ${wordClassName}`}
                        style={{ fontSize: `${size}vw` }}
                    >
                        {word}
                    </span>
                )}
            </div>
        </footer>
    )
}
