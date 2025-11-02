import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/SessionProvider";
import GlobalLayout from "@/components/GlobalLayout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Dan Enterprises - Coal Management System",
  description:
    "Comprehensive coal supply chain management system for Dan Enterprises",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <AuthSessionProvider>
          <GlobalLayout>{children}</GlobalLayout>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
