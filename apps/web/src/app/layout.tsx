import "../styles/globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen">
          <header className="border-b border-slate-800 sticky top-0 backdrop-blur bg-[rgba(11,18,32,0.8)]">
            <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
              <div className="text-lg font-semibold">Open Pilot Ledger</div>
              <nav className="text-sm opacity-80">Public • Prototype</nav>
            </div>
          </header>
          <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
        </div>
      </body>
    </html>
  );
}
