import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { Toaster } from 'react-hot-toast';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Phần mềm quản lý kho hàng EZKho | Quản lý tồn kho, đơn hàng, báo cáo",
  description: "Phần mềm quản lý kho EZKho giúp tối ưu quy trình nhập xuất, kiểm soát tồn kho chính xác và báo cáo doanh thu chi tiết. Giải pháp quản lý kho chuyên nghiệp cho doanh nghiệp vừa và nhỏ.",
  keywords: ["quản lý kho", "phần mềm kho", "inventory management", "ezkho", "quản lý đơn hàng", "quản lý tồn kho", "phần mềm quản lý bán hàng"],
  alternates: {
    canonical: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  },
  openGraph: {
    title: "Phần mềm quản lý kho hàng EZKho",
    description: "Giải pháp quản lý kho chuyên nghiệp, tối ưu quy trình nhập xuất và kiểm soát tồn kho.",
    type: "website",
    locale: "vi_VN",
    siteName: "EZKho",
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "EZKho",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web",
  "description": "Phần mềm quản lý kho hàng chuyên nghiệp giúp doanh nghiệp tối ưu quy trình nhập xuất, kiểm soát tồn kho và báo cáo chi tiết.",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "VND"
  },
  "featureList": [
    "Quản lý nhập xuất kho",
    "Báo cáo doanh thu, lợi nhuận",
    "Quản lý nhà cung cấp và khách hàng",
    "Cảnh báo tồn kho thấp"
  ]
};

import { GoogleAuthProviderWrapper } from "@/components/providers/GoogleAuthProviderWrapper";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <GoogleAuthProviderWrapper>
          <AuthProvider>
            {children}
            <Toaster position="top-right" />
          </AuthProvider>
        </GoogleAuthProviderWrapper>
      </body>
    </html>
  );
}
