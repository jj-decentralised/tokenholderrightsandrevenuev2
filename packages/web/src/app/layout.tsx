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
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0d1117] text-[#e6edf3] antialiased">
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-50 h-14 border-b border-[#30363d] bg-[#161b22]/95 backdrop-blur-sm">
            <nav className="flex items-center justify-between h-full px-4 max-w-[1440px] mx-auto">
              <div className="flex items-center gap-8">
                <a href="/" className="text-lg font-bold tracking-tight">
                  <span className="text-[#58a6ff]">Crypto</span>Terminal
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
                    placeholder="Search protocols... (Cmd+K)"
                    className="w-64 h-8 pl-3 pr-8 text-sm bg-[#0d1117] border border-[#30363d] rounded-md text-[#e6edf3] placeholder:text-[#8b949e] focus:outline-none focus:border-[#58a6ff]"
                  />
                </div>
              </div>
            </nav>
          </header>
          <main className="flex-1 max-w-[1440px] mx-auto w-full px-4 py-6">
            {children}
          </main>
          <footer className="border-t border-[#30363d] py-4 px-4">
            <div className="max-w-[1440px] mx-auto flex items-center justify-between text-xs text-[#8b949e]">
              <span>Crypto Terminal v1.0 | Data from DefiLlama, CoinGecko, Codex</span>
              <span>Built by decentralised.co</span>
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
      className="px-3 py-1.5 text-sm text-[#8b949e] hover:text-[#e6edf3] rounded-md hover:bg-[#21262d] transition-colors"
    >
      {children}
    </a>
  );
}
