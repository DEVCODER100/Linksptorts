'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy } from 'lucide-react';

const LINKS = [
  { href: '/predictions', label: 'Matches' },
  { href: '/predictions/mine', label: 'My Predictions' },
  { href: '/predictions/leaderboard', label: 'Leaderboard' },
  { href: '/predictor', label: 'Bracket Builder' },
];

/** Shared hero + sub-nav for all prediction pages. */
export default function PredictionsHeader({ subtitle }: { subtitle?: string }) {
  const pathname = usePathname();
  return (
    <div className="bg-gradient-to-br from-brand via-blue-600 to-indigo-700 text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 text-center">
        <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-4">
          <Trophy className="w-4 h-4" /> FIFA World Cup 2026
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Match Predictions</h1>
        {subtitle && <p className="mt-3 text-blue-100 max-w-xl mx-auto text-sm sm:text-base">{subtitle}</p>}

        {/* Sub-nav */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex gap-1 bg-white/10 backdrop-blur p-1 rounded-xl">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active ? 'bg-white text-brand shadow-sm' : 'text-white/90 hover:bg-white/10'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </div>
        </div>
        <div className="h-6" />
      </div>
    </div>
  );
}
