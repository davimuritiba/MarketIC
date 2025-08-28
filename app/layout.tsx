import "@/styles/globals.css";
import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google"

const mplus = M_PLUS_Rounded_1c({
  weight: ["700"], 
  subsets: ["latin"],
  display: "swap",
})

export const metadata: Metadata = {
  title: "MarketIC",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="bg-[#F0F0F0] text-neutral-900 {mplus.className">{children}</body>
    </html>
  );
}
