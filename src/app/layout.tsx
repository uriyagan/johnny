import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";
import { ErrorReporter } from "@/components/error-reporter";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Johnny — ניהול קמפיינים אוטומטי",
  description: "מנהל הקמפיינים החכם שלך בעברית",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="he" dir="rtl" className={heebo.variable}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
