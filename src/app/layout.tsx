import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RIDE — Request Integrated Document Ecosystem",
  description: "Ekosistem terintegrasi untuk pemesanan, pengelolaan, dan tracking dokumen perusahaan.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable} ${jakarta.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#F6F8FB] text-[#16233F] font-sans">
        <AppProvider>
          {children}
          <Toaster richColors position="top-right" closeButton />
        </AppProvider>
      </body>
    </html>
  );
}
