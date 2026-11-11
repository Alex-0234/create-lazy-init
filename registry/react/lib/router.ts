// Framework adapter. Components import routing from here instead of from react-router,
// so the same component file works in both the React Router and Next.js templates.
import { useLocation } from 'react-router'

export { Link } from './link'

export const usePathname = (): string => useLocation().pathname
