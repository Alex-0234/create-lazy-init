import type { ComponentProps, ReactNode } from 'react'
import { Image } from '@/lib/image'

/* Compound card:
   <ItemCard>
     <ItemCard.Image src={img} alt='' />
     <ItemCard.Details name='Item' price={250} onAction={buy} />
   </ItemCard> */

type ImageProps = ComponentProps<typeof Image> & {
    wrapperClassName?: string
}

type DetailsProps = {
    name: string
    description?: string
    price: number | string
    actionLabel?: string
    onAction?: () => void
}

interface ItemCardProps {
    children: ReactNode
    className?: string
}

export function ItemCard({
    children,
    className = 'max-w-80 mx-24 sm:mx-16 md:mx-12 p-4 bg-white h-100 grid grid-rows-2 font-jet',
}: ItemCardProps) {
    return <div className={className}>{children}</div>
}

ItemCard.Image = function ItemCardImage({ wrapperClassName = 'flex p-4 w-full h-full bg-white', ...imageProps }: ImageProps) {
    return (
        <div className={wrapperClassName}>
            <Image {...imageProps} />
        </div>
    )
}

ItemCard.Details = function ItemCardDetails({ name, description, price, actionLabel = 'Buy', onAction }: DetailsProps) {
    return (
        <div className='relative h-full w-full p-4'>
            <h3 className='text-white mix-blend-difference text-2xl uppercase'>{name}</h3>
            <span className='h-0.5 flex my-2 bg-white mix-blend-difference' />
            {description && (
                <div className='max-h-8 overflow-hidden'>
                    <p className='text-black text-xs uppercase max-h-16'>{description}</p>
                </div>
            )}

            <div className='absolute bottom-1 flex items-center gap-3'>
                <button type='button' onClick={onAction} className='p-2 uppercase bg-light text-black mix-blend-difference'>
                    {actionLabel}
                </button>
                <span className='text-black text-sm tabular-nums'>{price}</span>
            </div>
        </div>
    )
}
