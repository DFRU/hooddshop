import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import Nav from "@/components/layout/Nav";
import Footer from "@/components/layout/Footer";
import CartDrawer from "@/components/layout/CartDrawer";
import Analytics from "@/components/layout/Analytics";
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
  title: { default: "Hood'd — Car Hood Covers for World Cup 2026 | Your Ride. Your Flag.", template: "%s | Hood'd" },
  description:
    "Premium stretch-fit car hood covers for World Cup 2026. 48 nations, sublimation-printed on polyester spandex. Universal fit for cars, SUVs, and trucks. $49.99. Made to order.",
  metadataBase: new URL("https://hooddshop.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hooddshop.com",
    siteName: "Hood'd",
    title: "Hood'd — Car Hood Covers for World Cup 2026",
    description: "Premium stretch-fit car hood covers for 48 World Cup 2026 nations. Universal fit for cars, SUVs, and trucks. $49.99.",
    images: [{ url: "/vehicles/us_product.webp", width: 1200, height: 1200, alt: "USA car hood cover — Hood'd World Cup 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hood'd — Car Hood Covers for World Cup 2026",
    description: "Premium stretch-fit car hood covers for 48 nations. Universal fit. $49.99.",
    images: ["/vehicles/us_product.webp"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Hood'd",
              url: "https://hooddshop.com",
              logo: "https://hooddshop.com/favicon.png",
              description:
                "Premium stretch-fit car hood covers for World Cup 2026. 48 nations.",
              contactPoint: {
                "@type": "ContactPoint",
                email: "contact@hooddshop.com",
                contactType: "customer service",
              },
            }),
          }}
        />
        <Analytics />
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
