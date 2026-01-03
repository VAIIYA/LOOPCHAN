import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../src/index.css'
import { WalletProvider } from '@/contexts/WalletContext'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'LoopChan',
  description: 'Anonymous discussion platform powered by Solana',
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f97316', // Orange theme color for mobile browsers
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-orange-50 to-amber-50`}>
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  )
}
