import type { Metadata } from "next";
import { M_PLUS_Rounded_1c } from "next/font/google";
import "../styles/globals.css";

const mPlusRounded = M_PLUS_Rounded_1c({
  variable: "--font-m-plus-rounded-1c",
  subsets: ["latin"],
  weight: ["700"], 
});

export const metadata: Metadata = {
  title: "MarketIC",
  description: "Projeto de marketplace, focado para o instituto de computação",
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <body className={`${mPlusRounded}  antialiased`} >
        {children}
      </body>
    </html>
  );
}
