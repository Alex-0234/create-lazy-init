import type { ReactNode } from 'react'
import SmoothScrollProvider from './smoothScroll'
import UserProvider from './user'

/* every app-wide provider, in one place */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    /* anchors: Lenis scrolls to #hash links itself, React Router doesn't */
    <SmoothScrollProvider options={{ anchors: true }}>
      <UserProvider>{children}</UserProvider>
    </SmoothScrollProvider>
  )
}
