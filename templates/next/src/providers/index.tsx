import type { ReactNode } from 'react'
import SmoothScrollProvider from './smoothScroll'
import UserProvider from './user'

/* every app-wide provider, in one place */
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <UserProvider>{children}</UserProvider>
    </SmoothScrollProvider>
  )
}
