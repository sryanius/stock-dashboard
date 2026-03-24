import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import React from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI Stock Dashboard",
  description: "Real-time stock charts, indicators, and AI analysis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={inter.className}>
      <body>
        <main className="main-content">
          <div className="container">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
