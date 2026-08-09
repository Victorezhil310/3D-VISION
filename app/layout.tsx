import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "3D Vision | Professional Educational Platform",
  description: "Explore highly detailed 3D models and educational content across space, anatomy, engineering, and more.",
  verification: {
    google: "f08c47fec0942fa0", // From ads.txt DIRECT
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="google-adsense-account" content="ca-pub-6751037211810646" />
        <meta name="google-site-verification" content="PhqDCraPVcuNOgwktVSw2azc0jZV8jK2I4HSxFUygCE" />
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6751037211810646"
          crossOrigin="anonymous"
          strategy="lazyOnload"
        />
      </head>
      <body className={`${outfit.variable} font-sans bg-[#02040a] text-slate-200 min-h-screen flex flex-col`}>
        {/* Navigation Bar */}
        <nav className="sticky top-0 z-50 glass-nav px-6 py-4 flex items-center justify-between">
          <a href="/" className="text-2xl font-bold tracking-tighter flex items-center gap-2">
            <span className="text-primary text-3xl">⬡</span>
            <span className="text-gradient">3D VISION</span>
          </a>
          <div className="hidden md:flex gap-6 font-medium text-sm">
            <a href="/models" className="hover:text-primary transition">3D Models</a>
            <a href="/categories" className="hover:text-primary transition">Categories</a>
            <a href="/blog" className="hover:text-primary transition">Educational Blog</a>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer */}
        <footer className="glass-nav mt-auto py-8 px-6">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-slate-400">
              © {new Date().getFullYear()} 3D Vision Education. All rights reserved.
            </div>
            <div className="flex gap-4 text-sm text-slate-400">
              <a href="/about" className="hover:text-primary">About Us</a>
              <a href="/contact" className="hover:text-primary">Contact Us</a>
              <a href="/privacy" className="hover:text-primary">Privacy Policy</a>
              <a href="/terms" className="hover:text-primary">Terms of Service</a>
              <a href="/disclaimer" className="hover:text-primary">Disclaimer</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
