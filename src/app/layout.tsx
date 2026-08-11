import type { Metadata } from "next";
import { Cairo, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "نظام إدارة الاشتراكات",
  description: "نظام إدارة اشتراكات النادي الرياضي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={cn("h-full", "antialiased", cairo.variable, "font-sans", geist.variable)}>
      <body className="min-h-full flex flex-col font-cairo">
        {children}
      </body>
    </html>
  );
}
