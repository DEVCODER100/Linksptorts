'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PredictionsHeader from '@/components/predictions/PredictionsHeader';
import { predictionAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { Clock, CircleDot, CheckCircle2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

type Pick = 'HOME' | 'DRAW' | 'AWAY';

interface Match {
  _id: string;
  stage: string;
  groupLabel: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string;
  status: 'upcoming' | 'live' | 'finished' | 'postponed' | 'cancelled';
  homeScore: number | null;
  awayScore: number | null;
  isKnockout: boolean;
  locked: boolean;
  myPick: Pick | null;
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Group Stage', LAST_16: 'Round of 16', QUARTER_FINALS: 'Quarter-final',
  SEMI_FINALS: 'Semi-final', THIRD_PLACE: 'Third place', FINAL: 'Final',
};
const humanizeStage = (m: Match) =>
  m.groupLabel ? m.groupLabel.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : STAGE_LABELS[m.stage] || m.stage;

const TABS = [
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'live', label: 'Live' },
  { id: 'finished', label: 'Finished' },
] as const;
type TabId = (typeof TABS)[number]['id'];

export default function PredictionsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('upcoming');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await predictionAPI.getMatches();
        setMatches(res.data.data || []);
      } catch {
        toast.error('Could not load matches');
      }
      setIsLoading(false);
    })();
  }, []);

  const submitPick = async (matchId: string, pick: Pick) => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
    if (!isAuthenticated && !hasToken) {
      router.push('/auth/login?redirect=/predictions');
      return;
    }
    setSaving(matchId);
    try {
      await predictionAPI.predict(matchId, pick);
      setMatches((prev) => prev.map((m) => (m._id === matchId ? { ...m, myPick: pick } : m)));
      toast.success('Prediction saved');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Could not save your prediction';
      toast.error(msg);
      // If the server says it's locked, reflect that in the UI.
      if (/lock/i.test(msg)) setMatches((prev) => prev.map((m) => (m._id === matchId ? { ...m, locked: true } : m)));
    }
    setSaving(null);
  };

  const filtered = useMemo(() => {
    if (tab === 'live') return matches.filter((m) => m.status === 'live');
    if (tab === 'finished') return matches.filter((m) => m.status === 'finished');
    return matches.filter((m) => m.status === 'upcoming' || m.status === 'postponed' || m.status === 'cancelled');
  }, [matches, tab]);

  const counts = useMemo(() => ({
    upcoming: matches.filter((m) => ['upcoming', 'postponed', 'cancelled'].includes(m.status)).length,
    live: matches.filter((m) => m.status === 'live').length,
    finished: matches.filter((m) => m.status === 'finished').length,
  }), [matches]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PredictionsHeader subtitle="Pick the winner of every match. Lock in before kickoff and climb the leaderboard." />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit mb-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label} <span className="text-xs text-gray-400">({counts[t.id]})</span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-28" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Lock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No {tab} matches</h3>
            <p className="text-gray-500 text-sm">Fixtures sync automatically from the official schedule — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((m) => {
              const showScore = m.status === 'live' || m.status === 'finished';
              const canPick = m.status === 'upcoming' && !m.locked;
              const options: { pick: Pick; label: string }[] = m.isKnockout
                ? [{ pick: 'HOME', label: m.homeTeam }, { pick: 'AWAY', label: m.awayTeam }]
                : [{ pick: 'HOME', label: m.homeTeam }, { pick: 'DRAW', label: 'Draw' }, { pick: 'AWAY', label: m.awayTeam }];

              return (
                <div key={m._id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-gray-700">{humanizeStage(m)}</span>
                    {m.status === 'live' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded-full"><CircleDot className="w-3 h-3" /> Live</span>
                    ) : m.status === 'finished' ? (
                      <span className="text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Final</span>
                    ) : m.status === 'postponed' ? (
                      <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">Postponed</span>
                    ) : m.status === 'cancelled' ? (
                      <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">Cancelled</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> {formatDate(m.kickoffUtc, 'EEE, MMM d · h:mm a')}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-sm sm:text-base text-gray-900 flex-1 text-right truncate">{m.homeTeam}</span>
                    <span className="flex-shrink-0 min-w-[3rem] text-center">
                      {showScore ? <span className="font-extrabold text-base text-gray-900">{m.homeScore ?? 0} – {m.awayScore ?? 0}</span> : <span className="text-xs font-bold text-gray-400">VS</span>}
                    </span>
                    <span className="font-bold text-sm sm:text-base text-gray-900 flex-1 truncate">{m.awayTeam}</span>
                  </div>

                  {/* Pick controls */}
                  {canPick ? (
                    <div className={`mt-4 grid gap-2 ${m.isKnockout ? 'grid-cols-2' : 'grid-cols-3'}`}>
                      {options.map((o) => {
                        const selected = m.myPick === o.pick;
                        return (
                          <button
                            key={o.pick}
                            onClick={() => submitPick(m._id, o.pick)}
                            disabled={saving === m._id}
                            className={`px-2 py-2 rounded-xl text-xs sm:text-sm font-semibold border-2 transition-colors truncate disabled:opacity-60 ${
                              selected ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-brand hover:bg-blue-50'
                            }`}
                          >
                            {selected && <CheckCircle2 className="w-3 h-3 inline mr-1 -mt-0.5" />}{o.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-[11px] text-gray-400 text-center flex items-center justify-center gap-2">
                      <span>{formatDate(m.kickoffUtc, 'EEE, MMM d · h:mm a')}</span>
                      {m.myPick && (
                        <span className="inline-flex items-center gap-1 text-brand font-semibold">
                          <CheckCircle2 className="w-3 h-3" /> You picked {m.myPick === 'DRAW' ? 'Draw' : m.myPick === 'HOME' ? m.homeTeam : m.awayTeam}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
