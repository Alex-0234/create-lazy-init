import type { ComponentProps } from 'react'
import { Link as RouterLink } from 'react-router'

type LinkProps = Omit<ComponentProps<typeof RouterLink>, 'to'> & { href: string }

/* next/link API on top of React Router: `href` instead of `to` */
export function Link({ href, ...props }: LinkProps) {
    return <RouterLink to={href} {...props} />
}
