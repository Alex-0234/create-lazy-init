'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollIntoContext, TimelineContext, type ScrollInto } from "@/hooks/useScrollTimeline";

gsap.registerPlugin(ScrollTrigger);

// px of scroll per second of timeline
const SCROLL_PER_SECOND = 1600

/* read it with useMasterTimeline() / useScrollInto() from @/hooks/useScrollTimeline */
export function ScrollTimelineProvider({ children }: { children: ReactNode }) {
    const stageRef = useRef<HTMLDivElement>(null)
    const trackRef = useRef<HTMLDivElement>(null)
    const scrolledRef = useRef(0)
    const [master] = useState(() => gsap.timeline({ paused: true }))

    const scrollInto = useCallback<ScrollInto>((section) => {
        if (!section) return

        const distance = section.offsetTop - scrolledRef.current
        if (distance <= 0) return

        scrolledRef.current = section.offsetTop
        master.to(trackRef.current, {
            y: () => -section.offsetTop,
            duration: distance / SCROLL_PER_SECOND,
            ease: 'none',
        })
    }, [master])

    // a plain useEffect, not useGSAP: its cleanup would kill the master along
    // with the trigger, and strict mode re-runs effects on the same instance.
    // it runs after the children's useGSAP, so their tweens are already added
    useEffect(() => {
        const stage = stageRef.current
        const track = trackRef.current
        if (!stage || !track) return

        // carries whatever is left below the last animation up and off
        const getEnd = () => track.offsetHeight - stage.offsetHeight
        const remaining = getEnd() - scrolledRef.current
        if (remaining > 0) {
            master.to(track, {
                y: () => -getEnd(),
                duration: remaining / SCROLL_PER_SECOND,
                ease: 'none',
            })
        }

        const trigger = ScrollTrigger.create({
            trigger: stage,
            animation: master,
            start: 'top top',
            end: () => `+=${master.duration() * SCROLL_PER_SECOND}`,
            scrub: true,
            pin: true,
            invalidateOnRefresh: true,
        })

        return () => {
            trigger.kill(true, true)
            // start from an empty queue, or strict mode's re-run lands the
            // children's tweens after the old exit move
            master.clear()
            scrolledRef.current = 0
        }
    }, [master])

    return (
        <TimelineContext.Provider value={master}>
            <ScrollIntoContext.Provider value={scrollInto}>
                {/* the stage is the window, the track is the content moving behind it */}
                <div ref={stageRef} className="h-screen w-full overflow-hidden">
                    <div ref={trackRef} className="relative w-full">{children}</div>
                </div>
            </ScrollIntoContext.Provider>
        </TimelineContext.Provider>
    )
}
