import "./globals.css";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import LayoutHeader from "@/components/layout/layout-header";
import AppProvider from "@/app/providers";
import Universe from "@/components/universe";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Next.js and Supabase Starter Kit",
  description: "The fastest way to build apps with Next.js and Supabase",
};

const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground">
        <AppProvider>
          <main className="min-h-screen flex flex-col items-center">
            {/* <Universe /> */}
            <LayoutHeader />
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  );
}
