import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Crypto Terminal | Revenue, Valuation & Holder Intelligence",
  description:
    "Institutional-grade analytics connecting protocol revenue to token holder economics. Real P/E ratios, holder revenue yield, and productive token scores.",
  keywords: "crypto analytics, protocol revenue, token holder revenue, DeFi analytics, real P/E ratio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#fcfcf9] text-[#133c3b] antialiased">
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 h-14 border-b border-[#e5e5e3] bg-white/95 backdrop-blur-sm">
            <nav className="flex items-center justify-between h-full px-6 max-w-[1280px] mx-auto">
              <div className="flex items-center gap-10">
                <a href="/" className="text-lg font-bold tracking-tight text-[#133c3b]">
                  <span className="text-[#32b88d]">Crypto</span>Terminal
                </a>
                <div className="hidden md:flex items-center gap-1">
                  <NavLink href="/">Overview</NavLink>
                  <NavLink href="/revenue">Revenue Atlas</NavLink>
                  <NavLink href="/compare">Compare</NavLink>
                  <NavLink href="/holders">Holders</NavLink>
                  <NavLink href="/rights">Rights Registry</NavLink>
                  <NavLink href="/methodology">Methodology</NavLink>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden sm:block relative">
                  <input
                    type="text"
                    placeholder="Search protocols..."
                    className="w-56 h-8 pl-3 pr-8 text-sm bg-[#f7f7f5] border border-[#e5e5e3] rounded-lg text-[#133c3b] placeholder:text-[#8f9a9e] focus:outline-none focus:border-[#32b88d] focus:ring-1 focus:ring-[#32b88d]/20 transition-colors"
                  />
                </div>
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-[1280px] mx-auto w-full px-6 py-8">
            {children}
          </main>
          <footer className="border-t border-[#e5e5e3] py-5 px-6">
            <div className="max-w-[1280px] mx-auto flex items-center justify-between text-xs text-[#8f9a9e]">
              <span>Crypto Terminal v1.0 &middot; Data from DefiLlama, CoinGecko, Codex, Allium</span>
              <span>Powered by decentralised.co</span>
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
      className="px-3 py-1.5 text-sm text-[#626c71] hover:text-[#133c3b] rounded-lg hover:bg-[#f7f7f5] transition-colors"
    >
      {children}
    </a>
  );
}
