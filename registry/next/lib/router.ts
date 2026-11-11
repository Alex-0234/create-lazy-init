// Framework adapter. Components import routing from here instead of from next/*,
// so the same component file works in both the Next.js and React Router templates.
export { default as Link } from 'next/link'
export { usePathname } from 'next/navigation'
