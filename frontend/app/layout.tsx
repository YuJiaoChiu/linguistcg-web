import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'LinguistCG - Professional Subtitle Processing',
  description: '专为 CG 字幕组打造的智能字幕后期修正工具',
  keywords: ['subtitle', 'CG', 'translation', 'SRT', 'post-processing'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className={spaceGrotesk.className}>
        <div className="min-h-screen bg-neo-cream">
          {children}
        </div>
      </body>
    </html>
  )
}
