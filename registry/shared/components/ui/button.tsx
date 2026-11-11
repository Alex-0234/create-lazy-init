'use client'

import { Link } from "@/lib/router"
import type { ReactNode } from "react"

type Surface = 'dark' | 'light'

interface BaseProps {
    children: ReactNode
    variant?: 'solid' | 'outline'
    size?: 'sm' | 'md' | 'fluid'
    /* barva plochy, na které tlačítko leží — podle ní se otočí barvy */
    surface?: Surface
    /* ikona za textem, null ji schová */
    icon?: ReactNode
    className?: string
}

interface LinkProps extends BaseProps {
    href: string
    onClick?: never
    type?: never
    disabled?: never
}

interface ActionProps extends BaseProps {
    href?: never
    onClick?: () => void
    type?: 'button' | 'submit'
    disabled?: boolean
}

const SIZES = {
    sm: 'gap-2 px-5 py-2.5 text-[clamp(0.62rem,0.7vw,0.78rem)]',
    md: 'gap-3 px-8 py-4 text-[clamp(0.7rem,0.85vw,0.95rem)]',
    fluid: 'gap-2 px-4 py-2.5 text-[0.66rem] sm:gap-3 sm:px-8 sm:py-4 sm:text-[clamp(0.7rem,0.85vw,0.95rem)]',
}

export default function Button({
    href,
    children,
    variant = 'outline',
    size = 'md',
    surface = 'dark',
    icon = '→',
    className = '',
    onClick,
    type = 'button',
    disabled,
}: LinkProps | ActionProps) {
    const solid = variant === 'solid'
    const onLight = surface === 'light'

    const edge = onLight ? 'border-dark' : 'border-light'
    const fill = solid
        ? (onLight ? 'bg-dark text-light hover:text-dark' : 'bg-light text-dark hover:text-light')
        : (onLight ? 'text-dark hover:text-light' : 'text-light hover:text-dark')
    const sweep = solid
        ? (onLight ? 'bg-light' : 'bg-dark')
        : (onLight ? 'bg-dark' : 'bg-light')

    const classes = `group relative inline-flex items-center overflow-hidden border ${edge} ${SIZES[size]} font-jet uppercase tracking-[0.15em] whitespace-nowrap transition-colors duration-300 ${fill} ${className}`

    const content = (
        <>
            <span
                aria-hidden
                className={`absolute inset-0 translate-y-full transition-transform duration-300 ease-out group-hover:translate-y-0 ${sweep}`}
            />
            <span className='relative'>{children}</span>
            {icon !== null && (
                <span aria-hidden className='relative transition-transform duration-300 group-hover:translate-x-1'>{icon}</span>
            )}
        </>
    )

    if (href === undefined) {
        return (
            <button
                type={type}
                onClick={onClick}
                disabled={disabled}
                className={`${classes} cursor-pointer disabled:cursor-default disabled:opacity-50`}
            >
                {content}
            </button>
        )
    }

    return (
        <Link href={href} className={classes}>
            {content}
        </Link>
    )
}
