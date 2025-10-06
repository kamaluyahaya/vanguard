import "../styles/globals.css";
import SunBackground from "./components/sun-bg";
import { Toaster } from "sonner";

export const metadata = {
  title: "Vanguard Investment | Coins & Tesla Opportunities",
  description:
    "Vanguard Investment publishes curated Coins and Tesla investment opportunities from management, with clear plans, performance tracking, and an investor dashboard for transparent allocations and updates.",
  keywords: [
    "Vanguard Investment",
    "crypto pools",
    "coins investment",
    "Tesla investment",
    "investment platform",
    "investment plans",
    "portfolio tracking",
    "management posts",
    "investor dashboard",
    "KYC",
    "risk disclosure",
  ],
  icons: {
    icon: "/logo.png",
  },
  openGraph: {
    title: "Vanguard Investment | Coins & Tesla Opportunities",
    description:
      "Explore curated crypto pools and Tesla-focused plans posted by the Vanguard management team. Simple plans, transparent performance, and clear risk disclosures.",
    url: "https://vanguard-investment.com",
    siteName: "Vanguard Investment",
    images: [
      {
        url: "/logo.png",
        width: 1200,
        height: 630,
        alt: "Vanguard Investment preview",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Vanguard Investment | Coins & Tesla Opportunities",
    description:
      "Curated Coins and Tesla investment plans from management with tracking and transparent updates.",
    images: ["/logo.png"],
  },
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className="antialiased bg-sun-static min-h-screen relative text-slate-100 font-sans"
        style={{ fontFamily: "var(--font-geist-sans)" }}
      >
                <Toaster richColors position="top-center" />
        {/* Decorative sun-globs */}
        <SunBackground />

        <main className=" mx-auto px-6 py-8 relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}