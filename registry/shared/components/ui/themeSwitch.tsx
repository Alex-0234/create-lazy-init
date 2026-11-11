'use client'

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { resetTheme, themeTrigger, type Theme } from "@/utils/theme";

export default function ThemeSwitch({ theme }: { theme: Theme }) {
    const ref = useRef<HTMLDivElement>(null);

    useGSAP(() => {
        themeTrigger(ref.current, theme)
        return resetTheme
    }, { dependencies: [theme] })

    return <div ref={ref} aria-hidden className="h-screen w-full" />
}
