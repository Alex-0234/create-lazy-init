import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router'
import Providers from '@/providers'
import { getLenis } from '@/lib/scroll'

/* React Router keeps the scroll position between pages; Next.js resets it. Match Next. */
function useScrollReset() {
  const { pathname } = useLocation()

  useEffect(() => {
    const lenis = getLenis()
    if (lenis) lenis.scrollTo(0, { immediate: true })
    else window.scrollTo(0, 0)
  }, [pathname])
}

export default function RootLayout() {
  useScrollReset()

  return (
    <Providers>
      <main className="h-auto w-full">
        <Outlet />
      </main>
    </Providers>
  )
}
