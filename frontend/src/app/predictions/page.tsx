'use client';

import { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import PredictionsHeader from '@/components/predictions/PredictionsHeader';
import { predictionAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Trophy, CircleDot } from 'lucide-react';
import toast from 'react-hot-toast';

interface Match {
  _id: string;
  matchNo: number;
  round: string;
  roundLabel: string;
  kickoffUtc: string;
  venue: string | null;
  homeTeam: string | null;
  awayTeam: string | null;
  homeName: string;
  awayName: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished';
  winner: 'home' | 'away' | null;
  hasOpponentSlot: boolean;
}

const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'BRONZE', 'FINAL'];

export default function BracketPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await predictionAPI.getBracket();
        setMatches(res.data.data || []);
      } catch {
        toast.error('Could not load the bracket');
      }
      setIsLoading(false);
    })();
  }, []);

  const byRound = useMemo(() => {
    const groups: Record<string, Match[]> = {};
    for (const m of matches) (groups[m.round] ||= []).push(m);
    return ROUND_ORDER.filter((r) => groups[r]?.length).map((r) => ({ round: r, label: groups[r][0].roundLabel, items: groups[r] }));
  }, [matches]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PredictionsHeader subtitle="The full World Cup 2026 knockout bracket. Picks open here soon — predict each match all the way to the final." />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />)}</div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Bracket not loaded yet</h3>
            <p className="text-gray-500 text-sm">Fixtures sync automatically from the official schedule — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {byRound.map(({ round, label, items }) => (
              <section key={round}>
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide mb-3">{label}</h2>
                <div className="space-y-2.5">
                  {items.map((m) => {
                    const showScore = m.status === 'live' || m.status === 'finished';
                    const TeamRow = ({ name, resolved, score, isWinner, isOpponentSlot }: { name: string; resolved: boolean; score: number | null; isWinner: boolean; isOpponentSlot: boolean }) => (
                      <div className={`flex items-center justify-between gap-2 ${isWinner ? 'font-bold text-gray-900' : resolved ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                        <span className="truncate text-sm flex items-center gap-1.5">
                          {!resolved && isOpponentSlot && <span className="text-[9px] not-italic font-bold text-brand bg-blue-50 px-1.5 py-0.5 rounded">PREDICT</span>}
                          {name}
                        </span>
                        {showScore && <span className="font-extrabold text-sm flex-shrink-0">{score ?? 0}</span>}
                      </div>
                    );
                    return (
                      <div key={m._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2 text-[11px] text-gray-400">
                          <span>Match {m.matchNo}{m.venue ? ` · ${m.venue}` : ''}</span>
                          {m.status === 'live' ? (
                            <span className="inline-flex items-center gap-1 font-bold text-red-600"><CircleDot className="w-3 h-3" /> Live</span>
                          ) : m.status === 'finished' ? (
                            <span className="font-bold text-green-700">Final</span>
                          ) : (
                            <span>{formatDate(m.kickoffUtc, 'EEE, MMM d')}</span>
                          )}
                        </div>
                        <div className="space-y-1.5">
                          <TeamRow name={m.homeName} resolved={!!m.homeTeam} score={m.homeScore} isWinner={m.winner === 'home'} isOpponentSlot={m.hasOpponentSlot && !m.homeTeam} />
                          <div className="border-t border-gray-50" />
                          <TeamRow name={m.awayName} resolved={!!m.awayTeam} score={m.awayScore} isWinner={m.winner === 'away'} isOpponentSlot={m.hasOpponentSlot && !m.awayTeam} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
