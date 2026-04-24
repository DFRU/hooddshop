"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: { translate?: { TranslateElement: new (opts: unknown, id: string) => void } };
  }
}

/**
 * Google Translate inline widget.
 * Renders a compact language dropdown that auto-translates the entire page.
 * Styled to blend with the dark theme.
 */
export default function GoogleTranslate() {
  useEffect(() => {
    // Prevent double-init
    if (document.getElementById("google-translate-script")) return;

    window.googleTranslateElementInit = () => {
      if (window.google?.translate?.TranslateElement) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            includedLanguages: "en,es,fr,de,pt,ja,ko,ar,zh-CN,nl,it,tr,pl,sv,no,hr,cs,hu,sr",
            layout: 0, // SIMPLE layout (dropdown only, no banner)
            autoDisplay: false,
          },
          "google_translate_element"
        );
      }
    };

    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    <>
      <div id="google_translate_element" className="google-translate-wrapper" />
      <style jsx global>{`
        /* Hide Google Translate branding bar */
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }
        /* Style the dropdown to match dark theme */
        .google-translate-wrapper .goog-te-gadget {
          font-family: var(--font-dm-sans), sans-serif !important;
          font-size: 0 !important;
          color: transparent !important;
        }
        .google-translate-wrapper .goog-te-gadget > span { display: none !important; }
        .google-translate-wrapper .goog-te-combo {
          background: #141414 !important;
          color: #999 !important;
          border: 1px solid #333 !important;
          border-radius: 6px !important;
          padding: 6px 8px !important;
          font-size: 12px !important;
          font-family: var(--font-dm-sans), sans-serif !important;
          outline: none !important;
          cursor: pointer !important;
          min-height: 32px !important;
        }
        .google-translate-wrapper .goog-te-combo:hover {
          border-color: #555 !important;
        }
        /* Hide Google's logo link */
        .google-translate-wrapper .goog-logo-link { display: none !important; }
        .google-translate-wrapper .goog-te-gadget .goog-te-gadget-simple { display: none !important; }
      `}</style>
    </>
  );
}
