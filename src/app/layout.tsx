import './globals.css'
export const metadata = {
  title: '血統書管理',
  description: '猫の血統情報の検索・登録・印刷',
  robots: { index: false, follow: false },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
