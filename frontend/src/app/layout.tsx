import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { QueryProvider } from "@/lib/providers";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LMS — Learning Management System",
  description: "Professional learning management system for courses, quizzes, assignments, and certifications.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning
        className={`${inter.variable} font-sans antialiased bg-white text-slate-900`}
      >
        <QueryProvider>
          <script dangerouslySetInnerHTML={{__html: `
            window.addEventListener('error', function(e) {
              if (e.message && e.message.includes('releasePointerCapture')) {
                e.preventDefault();
                e.stopPropagation();
                return true;
              }
            }, true);
          `}} />
          {children}
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  );
}
