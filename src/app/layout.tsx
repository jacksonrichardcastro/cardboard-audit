import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/layout/site-header";

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
  description: "The trading card marketplace where serious collectors find their holy grails. Vetted sellers, full transparency, fair fees.",
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
        <body 
          className="min-h-screen flex flex-col font-sans"
          style={{
            backgroundColor: '#0a0a0a',
            backgroundImage: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124, 58, 237, 0.18) 0%, rgba(124, 58, 237, 0.08) 30%, rgba(0, 0, 0, 0) 70%)',
            backgroundAttachment: 'fixed',
          }}
        >
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
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
// touch
