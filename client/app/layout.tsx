import type { Metadata } from "next";
import Script from "next/script";
import "../public/assets/style.css";
import "../public/assets/responsive.css";
import "../public/assets/fonts/font-awesome/css/font-awesome.min.css";

export const metadata: Metadata = {
  title: "Aviator",
  description: "Aviator Crash Game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="referrer" content="no-referrer-when-downgrade" />
        <Script src="js/konva.min.js" strategy="beforeInteractive" />
        <Script src="js/gifler.min.js" strategy="beforeInteractive" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
