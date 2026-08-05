import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Geist_Mono } from "next/font/google";
import "./globals.css";

const vietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["vietnamese", "latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Tu Luyện Gym — Duolingo cho Gym",
    template: "%s · Tu Luyện Gym",
  },
  description:
    "Biến mỗi buổi tập thành một bước tu luyện. Check-in hằng ngày, tăng EXP, phá cảnh, khiêu chiến Boss cùng cộng đồng.",
  applicationName: "Tu Luyện Gym",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0d0f1a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`dark ${vietnamPro.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-mystic-radial">
        {children}
      </body>
    </html>
  );
}
