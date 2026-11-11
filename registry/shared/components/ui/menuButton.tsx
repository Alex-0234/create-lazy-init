'use client'

import type { RefObject } from 'react'
import { MENU_BUTTON_TEXTS as LABELS } from '@/data/texts'

interface MenuButtonProps {
    onClick: () => void
    expanded: boolean
    controls: string
    btnRef?: RefObject<HTMLButtonElement | null>
    labels?: Partial<typeof LABELS>
    className?: string
    /* barva čárek hamburgeru */
    barClassName?: string
}

export default function MenuButton({
    onClick,
    expanded,
    controls,
    btnRef,
    labels,
    className = 'border-light/30 hover:border-light',
    barClassName = 'bg-light',
}: MenuButtonProps) {
    const text = { ...LABELS, ...labels }

    return (
        <button
            ref={btnRef}
            type='button'
            onClick={onClick}
            aria-expanded={expanded}
            aria-controls={controls}
            aria-label={expanded ? text.close : text.open}
            className={`group relative flex h-10 w-10 cursor-pointer items-center justify-center border transition-colors duration-300 ${className}`}
        >
            <span
                aria-hidden
                className={`absolute h-px w-5 transition-transform duration-300 ease-out ${barClassName}`}
                style={{ transform: expanded ? 'rotate(45deg)' : 'translateY(-3px)' }}
            />
            <span
                aria-hidden
                className={`absolute h-px w-5 transition-transform duration-300 ease-out ${barClassName}`}
                style={{ transform: expanded ? 'rotate(-45deg)' : 'translateY(3px)' }}
            />
        </button>
    )
}
