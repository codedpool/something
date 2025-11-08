import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Auth0ProviderWrapper from "./components/Auth0ProviderWrapper";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "WealthPulse",
  description: "made with 💖 by Phoenix Arcana🐦‍🔥",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Auth0ProviderWrapper>
          {children}
        </Auth0ProviderWrapper>
      </body>
    </html>
  );
}
