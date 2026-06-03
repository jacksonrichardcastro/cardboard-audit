import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-display",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trax — By the hobby. For the hobby.",
  description: "Premium trading card marketplace. By the hobby. For the hobby.",
  metadataBase: new URL('https://trax.cards'),
  openGraph: { 
    title: 'Trax — By the hobby. For the hobby.', 
    description: 'Premium trading card marketplace. By the hobby. For the hobby.', 
    url: 'https://trax.cards', 
    siteName: 'Trax', 
    type: 'website' 
  },
  twitter: { 
    card: 'summary_large_image', 
    title: 'Trax — By the hobby. For the hobby.', 
    description: 'Premium trading card marketplace. By the hobby. For the hobby.' 
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html
        lang="en"
        className={`${inter.variable} ${outfit.variable} h-screen antialiased dark`}
        suppressHydrationWarning
      >
        <body className="min-h-screen flex flex-col font-sans">
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <SiteHeader />
            <main className="flex-1">
              {children}
            </main>
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
// touch
