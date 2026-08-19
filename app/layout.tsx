import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "vietnamese"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ConstructionTracker — Quản lý & Giám sát Thi công",
  description: "Theo dõi các dự án thi công và lắp đặt thiết bị nhà máy với kế hoạch WBS, nhật ký công trình hàng ngày và hình ảnh thực địa.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={cn("h-full", inter.variable, "font-sans", geist.variable)}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 antialiased">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
