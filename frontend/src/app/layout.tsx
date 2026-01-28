import { ReactNode } from "react"
import "./globals.css"

type Props = {
  children: ReactNode
}

// Since we have a `[locale]` dynamic segment, this layout provides
// a minimal root wrapper for Next.js App Router.
export default function RootLayout({ children }: Props) {
  return children
}
