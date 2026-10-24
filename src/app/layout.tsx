import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UNiCOM — Multi-Store Command Center",
  description:
    "Connect every store you run. Command them all with agents that watch, plan, act — and always leave evidence. Powered by zcode.",
  keywords: ["ecommerce", "multi-store", "AI agents", "Shopify", "WooCommerce", "Etsy", "command center"],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "UNiCOM — Multi-Store Command Center",
    description: "One agentic command center for every store you run.",
    siteName: "UNiCOM",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  );
}
