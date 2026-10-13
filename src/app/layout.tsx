import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "Sereno — Tu tutor con IA para estudiar sin estrés",
  description:
    "Sereno es un tutor académico con IA que te ayuda a estudiar, generar quizzes, organizar tu tiempo y cuidar tu bienestar. Proyecto ExpoUniandes.",
  appleWebApp: { capable: true, title: "Sereno", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#4f7cff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="aurora-bg" />
        <div className="aurora-orb" aria-hidden="true" />
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
