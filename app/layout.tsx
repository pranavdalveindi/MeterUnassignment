import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Meter Unassign Tool',
  description: 'Unassign a meter from a household',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
