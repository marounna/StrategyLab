import type { Metadata } from "next";
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
  title: "Strategy Lab",
  description: "A checklist-based approach to evaluating long trade setups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`
          ${geistSans.variable}
          ${geistMono.variable}
          antialiased
          min-h-screen
          bg-[url('/bgIMG.png')]
          bg-cover
          bg-center
          bg-no-repeat
          bg-fixed
          relative
        `}
      >
        {/* Dark overlay behind everything */}
        <div className="fixed inset-0 bg-black/60 -z-10" />

        {children}
      </body>
    </html>
  );
}
