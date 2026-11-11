import { GITHUB, GOOGLE_MAPS, LINKEDIN } from './site'

export interface NavLink {
    name: string
    href: string
}

export const NAVIGATION: NavLink[] = [
    { name: 'Home', href: '/' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
]

export const SOCIALS: NavLink[] = [
    { name: 'GitHub', href: GITHUB },
    { name: 'LinkedIn', href: LINKEDIN },
    { name: 'Google Maps', href: GOOGLE_MAPS },
]

/* id of the footer's contact form anchor, so other links can point at it */
export const CONTACT_ANCHOR = 'inquiry'

/* header button: right side of the bar (desktop), bottom of the mobile menu */
export const HEADER_CTA = { label: 'Contact', mobileLabel: 'Get in touch', href: `#${CONTACT_ANCHOR}` }

export const HERO_PRIMARY_CTA = { label: 'Get in touch', href: `#${CONTACT_ANCHOR}` }
export const HERO_SECONDARY_CTA = { label: 'About', href: '/about' }

/* link next to the e-mail at the bottom of the mobile menu */
export const HEADER_SOCIAL: NavLink = { name: 'GitHub', href: GITHUB }
