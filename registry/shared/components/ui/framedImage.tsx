import { Image } from "@/lib/image"
import type { ComponentProps, CSSProperties, ReactNode, Ref } from "react";

type FramedImageProps = Omit<ComponentProps<typeof Image>, 'fill' | 'ref'> & {
    frameRef?: Ref<HTMLDivElement>
    imageRef?: Ref<HTMLImageElement>
    frameClassName?: string
    frameStyle?: CSSProperties
    overscan?: number
    children?: ReactNode
}

export default function FramedImage({
    frameRef,
    imageRef,
    frameClassName = '',
    frameStyle,
    overscan = 0,
    className = '',
    style,
    sizes = '100vw',
    alt,
    children,
    ...imageProps
}: FramedImageProps) {
    return (
        <div ref={frameRef} className={`relative overflow-hidden ${frameClassName}`} style={frameStyle}>
            <div className="absolute inset-x-0" style={{ top: `${-overscan}%`, bottom: `${-overscan}%` }}>
                <Image
                    ref={imageRef}
                    fill
                    sizes={sizes}
                    alt={alt}
                    className={`object-cover will-change-transform ${className}`}
                    style={style}
                    {...imageProps}
                />
            </div>
            {children && <div className="relative h-full w-full">{children}</div>}
        </div>
    )
}
