import type { Metadata } from "next";
import { Playfair_Display, Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Bella Luxe Day Spa — Membership CRM",
  description:
    "Luxurious spa membership management for Bella Luxe Day Spa. Manage members, plans, appointments, payments, staff and more.",
  keywords: [
    "Bella Luxe",
    "Day Spa",
    "CRM",
    "Membership",
    "Chandigarh",
    "Spa Management",
  ],
  authors: [{ name: "Bella Luxe Day Spa" }],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${playfair.variable} ${cormorant.variable} ${inter.variable} antialiased bg-[#F8F1E9] text-[#1A1A1A]`}
      >
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid rgba(217, 112, 138, 0.25)",
              color: "#1A1A1A",
              borderRadius: "12px",
              boxShadow:
                "0 10px 25px -5px rgba(61,31,43,0.15), 0 8px 10px -6px rgba(61,31,43,0.08)",
            },
          }}
        />
      </body>
    </html>
  );
}
