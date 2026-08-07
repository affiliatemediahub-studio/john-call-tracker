export const metadata = {
  title: 'John Call Tracker',
  description: 'EVA Call Log Dashboard'
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0a0a0a', color: '#f0f0f0', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
        {children}
      </body>
    </html>
  )
}
