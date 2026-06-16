'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import { predictionAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { Trophy, CheckCircle2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Match {
  _id: string;
  teamA: string;
  teamAFlag?: string;
  teamB: string;
  teamBFlag?: string;
  matchDate: string;
  stage?: string;
  status: 'upcoming' | 'locked' | 'finished';
  result: 'teamA' | 'teamB' | 'draw' | null;
  teamACount: number;
  teamBCount: number;
  total: number;
  myPick: 'teamA' | 'teamB' | null;
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

export default function PredictionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => { fetchMatches(); }, []);

  const fetchMatches = async () => {
    setIsLoading(true);
    try {
      const res = await predictionAPI.getMatches();
      setMatches(res.data.data || []);
    } catch {
      toast.error('Could not load matches');
    }
    setIsLoading(false);
  };

  const vote = async (matchId: string, pick: 'teamA' | 'teamB') => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
    if (!isAuthenticated && !hasToken) {
      router.push('/auth/login?redirect=/predictions');
      return;
    }
    setVoting(matchId);
    try {
      const res = await predictionAPI.vote(matchId, pick);
      const updated = res.data.data as Match;
      setMatches((prev) => prev.map((m) => (m._id === matchId ? updated : m)));
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Could not record your vote';
      toast.error(msg);
    }
    setVoting(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero */}
      <div className="bg-gradient-to-br from-brand via-blue-600 to-indigo-700 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold mb-4">
            <Trophy className="w-4 h-4" /> World Cup 2026
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Predict the Winners</h1>
          <p className="mt-3 text-blue-100 max-w-xl mx-auto text-sm sm:text-base">
            Call which team takes the match. See what the LinkSports community thinks — and bragging rights when you&apos;re right.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="h-3 w-24 bg-gray-200 rounded mb-4" />
              <div className="flex gap-3">
                <div className="flex-1 h-16 bg-gray-100 rounded-xl" />
                <div className="flex-1 h-16 bg-gray-100 rounded-xl" />
              </div>
            </div>
          ))
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No matches yet</h3>
            <p className="text-gray-500 text-sm">Fixtures will appear here soon — check back before kickoff.</p>
          </div>
        ) : (
          matches.map((m) => {
            const voted = m.myPick !== null;
            const closed = m.status !== 'upcoming' || new Date(m.matchDate).getTime() <= Date.now();
            const showResults = voted || closed;
            const aPct = pct(m.teamACount, m.total);
            const bPct = pct(m.teamBCount, m.total);

            const TeamButton = ({ side, name, flag, votePct, isMine, isWinner }: {
              side: 'teamA' | 'teamB'; name: string; flag?: string; votePct: number; isMine: boolean; isWinner: boolean;
            }) => (
              <button
                onClick={() => !closed && vote(m._id, side)}
                disabled={closed || voting === m._id}
                className={`relative flex-1 overflow-hidden rounded-xl border-2 p-3 sm:p-4 text-left transition-all ${
                  isMine ? 'border-brand bg-blue-50/60' : 'border-gray-200 bg-white'
                } ${!closed ? 'hover:border-brand hover:bg-blue-50/40 cursor-pointer' : 'cursor-default'} disabled:opacity-100`}
              >
                {showResults && (
                  <div
                    className={`absolute inset-y-0 left-0 ${isMine ? 'bg-brand/15' : 'bg-gray-100'} transition-all duration-500`}
                    style={{ width: `${votePct}%` }}
                  />
                )}
                <div className="relative flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-2xl sm:text-3xl flex-shrink-0">{flag || '🏳️'}</span>
                    <span className="font-bold text-sm sm:text-base text-gray-900 truncate">{name}</span>
                  </div>
                  {showResults && (
                    <span className={`font-extrabold text-sm sm:text-base flex-shrink-0 ${isMine ? 'text-brand' : 'text-gray-500'}`}>
                      {votePct}%
                    </span>
                  )}
                </div>
                {(isMine || isWinner) && (
                  <div className="relative mt-1.5 flex items-center gap-1 text-[11px] font-semibold">
                    {isMine && <span className="inline-flex items-center gap-0.5 text-brand"><CheckCircle2 className="w-3 h-3" /> Your pick</span>}
                    {isWinner && <span className="inline-flex items-center gap-0.5 text-green-600"><Trophy className="w-3 h-3" /> Winner</span>}
                  </div>
                )}
              </button>
            );

            return (
              <div key={m._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {m.stage && <span className="font-semibold text-gray-700">{m.stage}</span>}
                    <span>·</span>
                    <span>{formatDate(m.matchDate, 'MMM d, h:mm a')}</span>
                  </div>
                  {m.status === 'finished' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Final</span>
                  ) : closed ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"><Lock className="w-3 h-3" /> Closed</span>
                  ) : (
                    <span className="text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">Open</span>
                  )}
                </div>

                <div className="flex items-stretch gap-3">
                  <TeamButton side="teamA" name={m.teamA} flag={m.teamAFlag} votePct={aPct} isMine={m.myPick === 'teamA'} isWinner={m.result === 'teamA'} />
                  <div className="flex items-center text-xs font-bold text-gray-400">VS</div>
                  <TeamButton side="teamB" name={m.teamB} flag={m.teamBFlag} votePct={bPct} isMine={m.myPick === 'teamB'} isWinner={m.result === 'teamB'} />
                </div>

                <p className="mt-3 text-[11px] text-gray-400 text-center">
                  {m.total > 0 ? `${m.total} ${m.total === 1 ? 'prediction' : 'predictions'}` : 'Be the first to predict'}
                  {!closed && voted && ' · tap a team to change your pick'}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
