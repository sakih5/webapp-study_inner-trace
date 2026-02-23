import type { Metadata } from "next";
import { Inter, Noto_Sans_JP, Source_Code_Pro } from "next/font/google";
import "./globals.css";
import { SaveStatusProvider } from "@/contexts/SaveStatusContext";
import { AppShell } from "@/components/shared/AppShell";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "600", "800"],
  display: "swap",
});

const sourceCodePro = Source_Code_Pro({
  variable: "--font-source-code-pro",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Inner Trace",
  description: "行動・感情記録 & 振り返りWebアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${inter.variable} ${notoSansJP.variable} ${sourceCodePro.variable} antialiased`}
      >
        <SaveStatusProvider>
          <AppShell>
            {children}
          </AppShell>
        </SaveStatusProvider>
      </body>
    </html>
  );
}
