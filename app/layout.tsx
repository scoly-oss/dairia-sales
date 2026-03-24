import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'DAIRIA Sales — CRM Cabinet d\'Avocats',
  description: 'CRM commercial intelligent pour DAIRIA Avocats',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
