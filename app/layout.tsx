import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import { ToastProvider } from "@/components/layout/Toast";
import "./globals.css";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-bebas-neue",
});

const body = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0A0A0A",
};

export const metadata: Metadata = {
  title: { default: "Hood'd | Car Hood Covers — Your Ride. Your Flag.", template: "%s | Hood'd" },
  description:
    "Premium stretch-fit car hood covers for World Cup 2026. 48 nations. Multiple design lines. $44.99.",
  metadataBase: new URL("https://hooddshop.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hooddshop.com",
    siteName: "Hood'd",
    title: "Hood'd — Your Ride. Your Flag.",
    description: "Premium car hood covers for World Cup 2026. 48 nations. Multiple design lines.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hood'd — Your Ride. Your Flag.",
    description: "Premium car hood covers for World Cup 2026.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${body.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}
      >
        <CartProvider>
          <ToastProvider>
            <Nav />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
          </ToastProvider>
        </CartProvider>
      </body>
    </html>
  );
}
