import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import AuthProvider from "@/components/auth/AuthProvider";
import InactivityHandler from "@/components/auth/InactivityHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DAPA RUN - Dumaguete",
  description: "Philippines' premier running event organizer. From fun runs to ultra marathons, we create unforgettable race experiences that challenge and inspire runners of all levels.",
  keywords: ["DAPA RUN", "running events", "marathon", "fun run", "ultra marathon", "Philippines", "race organizer"],
  authors: [{ name: "DAPA RUN" }],
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "64x64" },
      { url: "/favicon.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "DAPA RUN - Dumaguete",
    description: "Philippines' premier running event organizer",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              fetch('/api/settings')
                .then(r => r.json())
                .then(s => {
                  if (s.siteTitle) document.title = s.siteTitle;
                })
                .catch(() => {});
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <InactivityHandler />
          {children}
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
