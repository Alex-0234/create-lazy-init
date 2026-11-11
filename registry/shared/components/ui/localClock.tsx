'use client'

import { useEffect, useMemo, useState } from "react"
import { LOCALE, TIME_ZONE } from "@/data/site"
import { CLOCK_PLACEHOLDER as PLACEHOLDER } from "@/data/texts"

interface LocalClockProps {
    locale?: string
    timeZone?: string
    placeholder?: string
    className?: string
}

export default function LocalClock({
    locale = LOCALE,
    timeZone = TIME_ZONE,
    placeholder = PLACEHOLDER,
    className = '',
}: LocalClockProps) {
    const [time, setTime] = useState<string | null>(null)

    const formatter = useMemo(() => new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone,
    }), [locale, timeZone])

    useEffect(() => {
        const tick = () => setTime(formatter.format(new Date()))
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [formatter])

    return <span className={`tabular-nums ${className}`}>{time ?? placeholder}</span>
}
