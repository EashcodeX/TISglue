import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClientProvider } from "@/contexts/ClientContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import GlobalSearchProvider from "@/components/GlobalSearchProvider";
import PWAInstallPrompt from "@/components/PWAInstallPrompt";
import PWAProvider from "@/components/PWAProvider";
import AuthGate from "@/components/AuthGate";
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
  title: "ITGlue Clone - IT Documentation Platform",
  description: "Enterprise IT documentation and management platform with offline support",
  manifest: "/manifest.json",
  themeColor: "#3B82F6",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ITGlue Clone"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [
      { url: "/icons/icon-152x152.png", sizes: "152x152", type: "image/png" }
    ]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "ITGlue Clone",
    "application-name": "ITGlue Clone",
    "msapplication-TileColor": "#3B82F6",
    "msapplication-config": "/browserconfig.xml"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <NotificationProvider>
            <PWAProvider>
              <AuthProvider>
                <ClientProvider>
                  <GlobalSearchProvider>
                    <AuthGate>
                      {children}
                    </AuthGate>
                    <PWAInstallPrompt />
                  </GlobalSearchProvider>
                </ClientProvider>
              </AuthProvider>
            </PWAProvider>
          </NotificationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
