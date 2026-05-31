import type { Metadata, Viewport } from "next";
import { Bebas_Neue, DM_Sans } from "next/font/google";
import { CartProvider } from "@/context/CartContext";
import Nav from "@/components/layout/Nav";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
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
  title: { default: "Hood'd — Stretch Hood Covers for Your Car · 48 Nations · World Cup 2026", template: "%s | Hood'd" },
  description:
    "Stretch-fit car hood covers. 48 nations. Made to order. Full-bleed sublimation print on polyester-spandex. Universal fit for cars, SUVs, and trucks. Independent brand — not licensed by FIFA, federations, or kit makers.",
  metadataBase: new URL("https://hooddshop.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://hooddshop.com",
    siteName: "Hood'd",
    title: "Hood'd — Your Ride. Your Flag.",
    description: "Stretch hood covers for cars. 48 World Cup 2026 nations. Slips on in 30 seconds. Slips off in 10. hooddshop.com.",
    images: [{ url: "/og-hero.jpg", width: 1200, height: 630, alt: "Hood'd — Stretch hood covers for cars · 48 nations · World Cup 2026" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hood'd — Your Ride. Your Flag.",
    description: "Stretch hood covers for cars. 48 nations. From $34.99 USD.",
    site: "@hooddshopnow",
    creator: "@hooddshopnow",
    images: ["/og-hero.jpg"],
  },
  icons: {
    icon: "/favicon.png",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "facebook-domain-verification": "93jif5o59aw47rauqrkdkmunn9ajh5",
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
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "Hood'd",
                url: "https://hooddshop.com",
                logo: "https://hooddshop.com/favicon.png",
                description:
                  "Stretch-fit car hood covers. 48 World Cup 2026 nations. Full-bleed sublimation print on polyester-spandex. Independent brand.",
                contactPoint: {
                  "@type": "ContactPoint",
                  email: "contact@hooddshop.com",
                  contactType: "customer service",
                },
                sameAs: [
                  "https://www.instagram.com/hooddshopnow",
                  "https://www.tiktok.com/@hooddshopnow",
                  "https://www.youtube.com/@hooddshopnow",
                  "https://www.facebook.com/61563693766586",
                ],
              },
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                name: "Hood'd",
                url: "https://hooddshop.com",
                description:
                  "Stretch hood covers for cars. 48 World Cup 2026 nations available.",
                potentialAction: {
                  "@type": "SearchAction",
                  target: {
                    "@type": "EntryPoint",
                    urlTemplate: "https://hooddshop.com/shop?q={search_term_string}",
                  },
                  "query-input": "required name=search_term_string",
                },
              },
            ]),
          }}
        />
        <Analytics />
        <CartProvider>
          <ToastProvider>
            <AnnouncementBar />
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
