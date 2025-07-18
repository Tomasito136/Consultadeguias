import type React from "react"
import type { Metadata } from "next"
import "./globals.css"

// Poppins será importada en globals.css

export const metadata: Metadata = {
  title: "Monitor de Guías TCA - Unlimited Cargo",
  description: "Aplicación para verificar el estado de guías aéreas desde Excel para Unlimited Cargo",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      {/* La clase 'font-poppins' se aplicará desde globals.css */}
      <body>{children}</body>
    </html>
  )
}
