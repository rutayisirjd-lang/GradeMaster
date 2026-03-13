import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: '--font-heading',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "GradeMaster | Academic excellence, precisely tracked.",
  description: "Advanced school marks management system for modern educational institutions.",
  manifest: "/manifest.json",
  appleWebApp: {
    title: "GradeMaster",
    statusBarStyle: "black-translucent",
    capable: true,
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import { Toaster } from 'react-hot-toast'
import Providers from "@/components/shared/Providers";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(
        "min-h-screen font-inter bg-background text-foreground selection:bg-emerald-500/30",
        inter.variable,
        plusJakarta.variable
      )}>
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--foreground))',
              border: '1px solid hsl(var(--border))',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: 'hsl(var(--background))',
              }
            }
          }}
        />
      </body>
    </html>
  );
}
