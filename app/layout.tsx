import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "KaraOKZ · Sing, Play, Good Vibes",
  description: "Karaoke nights with friends: queue OPM and classic karaoke tracks from any phone and sing on the big screen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${rubik.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
