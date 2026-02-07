import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Terminal | Revenue, Valuation & Holder Intelligence",
  description:
    "Institutional-grade analytics connecting protocol revenue to token holder economics. Real P/E ratios, holder revenue yield, and productive token scores.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-white text-[#111] font-serif antialiased">
        <div className="flex flex-col min-h-screen">
          {/* Masthead */}
          <header className="pt-4 pb-0 px-6">
            <div className="max-w-[1280px] mx-auto">
              <div className="text-center mb-3">
                <h1 className="text-3xl md:text-4xl font-bold tracking-[0.15em] uppercase">
                  The Crypto Terminal
                </h1>
                <p className="text-xs text-[#888] mt-1 tracking-wide">
                  Revenue, Valuation &amp; Holder Intelligence
                </p>
              </div>
              <hr className="rule-heavy" />
              <nav className="flex items-center justify-center gap-0 py-2 text-sm flex-wrap">
                <NavLink href="/">Overview</NavLink>
                <Sep />
                <NavLink href="/screener">Screener</NavLink>
                <Sep />
                <NavLink href="/revenue">Revenue Atlas</NavLink>
                <Sep />
                <NavLink href="/holders">Holders</NavLink>
                <Sep />
                <NavLink href="/rights">Rights Registry</NavLink>
                <Sep />
                <NavLink href="/methodology">Methodology</NavLink>
              </nav>
              <hr className="rule" />
              <div className="flex items-center justify-between py-1.5 text-xs text-[#888]">
                <span>{today}</span>
                <span>Data: DefiLlama, CoinGecko, Codex</span>
              </div>
              <hr className="rule-thin" />
            </div>
          </header>

          <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8">
            {children}
          </main>

          <footer className="mt-12 border-t border-[#d0d0d0] py-4 px-6">
            <div className="max-w-[1280px] mx-auto flex items-center justify-between text-xs text-[#888]">
              <span className="italic">Powered by decentralised.co</span>
              <span>Data sources: DefiLlama &middot; CoinGecko &middot; Codex &middot; Allium</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="px-3 py-1 text-[#444] hover:text-[#111] hover:underline underline-offset-4 transition-colors"
    >
      {children}
    </a>
  );
}

function Sep() {
  return <span className="text-[#d0d0d0]">|</span>;
}
