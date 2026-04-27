import './globals.css'
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata = {
  title: 'Cat Pedigree System',
  description: 'Cat Pedigree Management System',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={cn("font-sans", geist.variable)}>
      <body>{children}</body>
    </html>
  )
}
