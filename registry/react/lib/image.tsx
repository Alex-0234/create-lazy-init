// Framework adapter. Mirrors the parts of next/image the components use,
// so the same component file works in both templates.
import type { ComponentProps } from 'react'

type ImageProps = ComponentProps<'img'> & {
    src: string
    alt: string
    /* fills the nearest positioned parent, like next/image `fill` */
    fill?: boolean
    /* loads eagerly with high priority, like next/image `priority` */
    priority?: boolean
}

export function Image({ fill, priority, style, ...props }: ImageProps) {
    return (
        <img
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : undefined}
            decoding='async'
            style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style}
            {...props}
        />
    )
}
