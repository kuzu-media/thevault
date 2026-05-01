import type { Metadata } from "next";
import "./globals.css";
import { TopBar } from "@/components/top-bar";

export const metadata: Metadata = {
  title: "The Vault",
  description: "Tracy's vault.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif&family=JetBrains+Mono:wght@400;600&family=Carlito:wght@400;700&display=swap"
        />
      </head>
      <body className="bg-vault-bg text-ink min-h-screen">
        <div className="absolute inset-0 lamp-glow pointer-events-none" />
        <TopBar />
        <main className="relative">{children}</main>
      </body>
    </html>
  );
}
