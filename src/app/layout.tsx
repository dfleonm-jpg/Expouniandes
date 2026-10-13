import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import "katex/dist/katex.min.css";
import { AppProvider } from "@/lib/app-context";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/ui/Toast";
import { XpToaster } from "@/components/ui/XpToaster";
import { PWAManager } from "@/components/ui/PWAManager";
import { AccessibilityButton } from "@/components/ui/AccessibilityButton";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Fuente display con carácter y calidez para titulares — da un aire más
// humano y editorial frente a una sans puramente geométrica.
const fraunces = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["SOFT", "opsz"],
});

export const metadata: Metadata = {
  title: "Sereno — Tu tutor con IA para estudiar sin estrés",
  description:
    "Sereno es un tutor académico con IA que te ayuda a estudiar, generar quizzes, organizar tu tiempo y cuidar tu bienestar. Proyecto ExpoUniandes.",
  appleWebApp: { capable: true, title: "Sereno", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#7c6cf0",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="aurora-bg" />
        <div className="aurora-orb" aria-hidden="true" />
        <div className="aurora-orb-warm" aria-hidden="true" />
        <div className="noise-overlay" aria-hidden="true" />
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              {children}
              <XpToaster />
              <PWAManager />
              <AccessibilityButton />
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
