"use client";

import Script from "next/script";

// ── Google Analytics 4 + Meta Pixel ──────────────────────────
// Replace these placeholder IDs with your actual IDs before launch.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID || "G-XXXXXXXXXX";
const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || "000000000000000";

export default function Analytics() {
  // Don't render tracking scripts with placeholder IDs in production
  const hasGA = GA_ID !== "G-XXXXXXXXXX";
  const hasMeta = META_PIXEL_ID !== "000000000000000";

  return (
    <>
      {/* ── Google Analytics 4 ── */}
      {hasGA && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}

      {/* ── Meta Pixel (Facebook / Instagram) ── */}
      {hasMeta && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${META_PIXEL_ID}');
            fbq('track', 'PageView');
          `}
        </Script>
      )}
    </>
  );
}
