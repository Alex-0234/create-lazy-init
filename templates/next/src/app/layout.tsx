import type { Metadata } from 'next'
import { Geist, JetBrains_Mono } from 'next/font/google'
import Providers from '@/providers'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin', 'latin-ext'],
})

export const metadata: Metadata = {
  title: 'App',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <main className="h-auto w-full">{children}</main>
        </Providers>
      </body>
    </html>
  )
}
