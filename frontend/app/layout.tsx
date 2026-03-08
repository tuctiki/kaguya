import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "kaguya | Tokyo Cast Explorer",
  description: "Premium dashboard for Tokyo delivery health data.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
