import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { ToastProvider } from "@genesis/ui";
import { AuthProvider } from "@/components/auth-provider";
import { QueryProvider } from "@/components/query-provider";
import { OrganizationJsonLd, WebApplicationJsonLd } from "@/components/seo/json-ld";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: {
    default: "Project Genesis - Cinematic AI Movie Generation",
    template: "%s | Project Genesis",
  },
  description:
    "Transform your creative vision into cinematic reality with AI-powered movie generation. Design scenes, direct with AI, and render production-quality content.",
  keywords: [
    "AI movie generation",
    "cinematic AI",
    "scene generation",
    "AI director",
    "video generation",
    "creative AI",
  ],
  authors: [{ name: "Project Genesis" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Project Genesis",
    title: "Project Genesis - Cinematic AI Movie Generation",
    description:
      "Transform your creative vision into cinematic reality with AI-powered movie generation.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Project Genesis",
    description:
      "Transform your creative vision into cinematic reality with AI-powered movie generation.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Genesis" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
        <link rel="preconnect" href="https://i.pravatar.cc" />
        <link rel="dns-prefetch" href="https://i.pravatar.cc" />
        <OrganizationJsonLd />
        <WebApplicationJsonLd />
      </head>
      <body className="min-h-screen bg-surface text-gray-100 font-sans antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>{children}</Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('/sw.js')})}`,
          }}
        />
      </body>
    </html>
  );
}

function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <QueryProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </QueryProvider>
    </AuthProvider>
  );
}
