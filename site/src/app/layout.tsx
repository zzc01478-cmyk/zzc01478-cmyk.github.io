import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";
import { PrivacyNotice } from "@/components/PrivacyNotice";
import { SiteEffects } from "@/components/SiteEffects";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { SITE } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  icons: { icon: { url: "/assets/favicon.svg?v=20260913-r1", type: "image/svg+xml" } },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f5f4ed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <a className="skip-link" href="#main">跳到内容</a>
        <div className="site-shell">
          <SiteHeader />
          <main id="main" tabIndex={-1}>{children}</main>
          <SiteFooter />
        </div>
        <PrivacyNotice />
        <SiteEffects />
        <Script
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"9b12d2665a774752a3eed790460ace35"}'
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
