'use client'

import { createContext, useContext } from 'react'
import type gsap from 'gsap'

export type ScrollInto = (section: HTMLElement | null) => void

/* filled by <ScrollTimelineProvider> in providers/scrollTimeline.tsx */
export const TimelineContext = createContext<ReturnType<typeof gsap.timeline> | null>(null)
export const ScrollIntoContext = createContext<ScrollInto | null>(null)

export const useMasterTimeline = () => useContext(TimelineContext)
export const useScrollInto = () => useContext(ScrollIntoContext)
