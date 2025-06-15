import "./globals.css";
import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import LayoutHeader from "@/components/layout/layout-header";
import AppProvider from "@/app/providers";
import Universe from "@/components/universe";
import { Toaster } from "@/components/ui/sonner";

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
          <main className="flex flex-col items-center max-w-3xl min-h-screen px-4 mx-auto sm:px-6 xl:max-w-5xl xl:px-0">
            {/* <Universe /> */}
            <LayoutHeader />
            {children}
          </main>
        </AppProvider>
        <Toaster />
      </body>
    </html>
  );
}
