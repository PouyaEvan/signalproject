import type { Metadata } from 'next'
import { Inter, Vazirmatn } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })
const vazirmatn = Vazirmatn({ subsets: ['arabic'] })

export const metadata: Metadata = {
  title: 'Brain Signal Analyzer | تحلیل سیگنال مغزی',
  description: 'Analyze brain signals with advanced filtering and AI-powered emotion detection',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      <body className={vazirmatn.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
