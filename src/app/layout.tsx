import type { Metadata } from "next";
import { Great_Vibes, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-playfair",
});
const greatVibes = Great_Vibes({ subsets: ["latin"], weight: "400", variable: "--font-great-vibes" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "BBE | Events That Tugs at Hearts.",
  description:
    "BBE plans weddings, debuts, birthdays and corporate events in Cagayan de Oro. Browse our work and send a booking request.",
  openGraph: {
    title: "BBE | Events That Tugs at Hearts.",
    description: "Your dream event, beautifully planned.",
    images: ["/logo.png"],
  },
};

// Applies the saved theme before first paint so there's no flash.
// Also arms the scroll-reveal animation before first paint (with a fallback that shows everything if scripts never load).
const themeScript = `try{var d=document.documentElement,t=localStorage.getItem("theme");d.setAttribute("data-theme",t==="dark"?"dark":"light")}catch(e){}try{document.documentElement.setAttribute("data-reveal-ready","");setTimeout(function(){if(!window.__revealReady)document.documentElement.removeAttribute("data-reveal-ready")},4000)}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${inter.variable} ${playfair.variable} ${greatVibes.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
