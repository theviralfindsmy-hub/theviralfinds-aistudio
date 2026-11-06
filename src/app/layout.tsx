import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TheViralFindsMY - Shopee Affiliate Manager Pro",
  description: "AI-powered Shopee affiliate management platform with HERMES Agent integration. Track earnings, manage links, analyze performance, and automate with AI.",
  keywords: ["Shopee", "affiliate", "Malaysia", "AI", "HERMES", "earnings", "analytics", "link management"],
  authors: [{ name: "TheViralFindsMY" }],
  applicationName: "TheViralFindsMY",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/logo.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/icons/icon-167.png", sizes: "167x167", type: "image/png" },
      { url: "/icons/icon-152.png", sizes: "152x152", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
  },
  appleWebApp: {
    capable: true,
    title: "TheViralFindsMY",
    statusBarStyle: "default",
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // allow zoom for accessibility (don't disable)
  minimumScale: 1,
  viewportFit: "cover", // respect notches / safe areas
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0066FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A1628" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA + iOS meta tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TheViralFindsMY" />
        <meta name="application-name" content="TheViralFindsMY" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="color-scheme" content="light dark" />
        {/* Disable automatic phone link detection on iOS Safari */}
        <meta name="format-detection" content="date=no email=no address=no" />
        {/* PWA splash background hint for older iOS */}
        <meta name="apple-touch-fullscreen" content="yes" />
      </head>
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground overscroll-y-none`}
      >
        {children}
      </body>
    </html>
  );
}
