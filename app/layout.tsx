import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import { withBasePath } from "@/lib/base-path";
import "./globals.css";

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || "PhD Network Map";

export const metadata: Metadata = {
  title: siteName,
  description: "Discover where Faculty of Arts PhD researchers are based and what they work on.",
  icons: { icon: withBasePath("/favicon.svg") }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
