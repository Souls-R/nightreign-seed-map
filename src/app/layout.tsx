import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Night Reign Seed Map 黑夜君临地图种子识别",
  description: "帮助你识别艾尔登法环：黑夜君临中的地图种子，快速得知当局信息",
};

// 定义需要预加载的图片URL
const preloadImages = [
  "/poi-assets/Default-POI.png",
  "/poi-assets/Mountaintop-POI.png",
  "/poi-assets/Crater-POI.png",
  "/poi-assets/Noklateo-POI.png",
  "/poi-assets/RottedWoods-POI.png",
  "/poi-assets/church.png",
  "/poi-assets/mage-tower.png",
  "/poi-assets/village.png",
  "/static/background_0.png",
  "/static/background_1.png",
  "/static/background_2.png",
  "/static/background_3.png",
  "/static/background_5.png",
  "/static/night_circle.png",
  "/static/nightlord_0.png",
  "/static/nightlord_1.png",
  "/static/nightlord_2.png",
  "/static/nightlord_3.png",
  "/static/nightlord_4.png",
  "/static/nightlord_5.png",
  "/static/nightlord_6.png",
  "/static/nightlord_7.png",
]


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {preloadImages.map((src) => (
          <link key={src} rel="preload" as="image" href={src} />
        ))}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
