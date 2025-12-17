import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'
import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css'
config.autoAddCss = false
import PublicOnlyComponents from '@/components/PublicOnlyComponents'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfairDisplay = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair-display' })

export const metadata: Metadata = {
  title: 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi | İzmir Çiğli',
  description: 'İzmir Çiğli\'de hizmet veren Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi, uzman kadrosuyla otizm, down sendromu, öğrenme güçlüğü gibi alanlarda bireysel eğitim ve terapi hizmetleri sunmaktadır.',
  keywords: ['özel eğitim', 'rehabilitasyon', 'izmir', 'çiğli', 'otizm', 'down sendromu', 'dil terapisi', 'fizyoterapi', 'bireysel eğitim', 'arkadaş özel eğitim'],
  openGraph: {
    title: 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi',
    description: 'Her çocuk özeldir. İzmir Çiğli\'de uzman kadromuzla yanınızdayız.',
    url: 'https://arkadasozelegitim.com',
    siteName: 'Arkadaş Özel Eğitim',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi',
    description: 'İzmir Çiğli\'de uzman özel eğitim ve rehabilitasyon hizmetleri.',
  },
  icons: {
    icon: '/images/favicon.svg',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arkadaş Özel Eğitim",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: "#ffffff",
};

import { Providers } from '@/components/Providers';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr" className="smooth-scroll" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfairDisplay.variable} font-body bg-neutral-light`}>
        <Providers>
          <a href="#main-content" className="skip-link">
            Ana içeriğe geç
          </a>
          {children}
          <PublicOnlyComponents />
        </Providers>
      </body>
    </html>
  )
}