'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import PredictionsHeader from '@/components/predictions/PredictionsHeader';
import { predictionAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/lib/utils';
import { Trophy, CircleDot, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Slot { type: string; group?: string; candidates?: string[]; matchNo?: number }
interface Match {
  matchNo: number; round: string; roundLabel: string; kickoffUtc: string; venue: string | null;
  homeSlot: Slot; awaySlot: Slot; homeLabel: string; awayLabel: string;
  homeTeam: string | null; awayTeam: string | null; homeScore: number | null; awayScore: number | null;
  status: 'upcoming' | 'live' | 'finished'; winner: 'home' | 'away' | null; locked: boolean; opponentMatch: boolean;
}
type Candidate = { group: string; team: string };

const ROUND_ORDER = ['R32', 'R16', 'QF', 'SF', 'BRONZE', 'FINAL'];

export default function BracketPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [matches, setMatches] = useState<Match[]>([]);
  const [candidates, setCandidates] = useState<Record<number, Candidate[]>>({});
  const [myPicks, setMyPicks] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await predictionAPI.getBracket();
      setMatches(res.data.data.matches || []);
      setCandidates(res.data.data.candidates || {});
      setMyPicks(res.data.data.myPicks || {});
    } catch {
      toast.error('Could not load the bracket');
    }
    setIsLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const byNo = useMemo(() => new Map(matches.map((m) => [m.matchNo, m])), [matches]);

  // Real group winner/runner-up teams (shared truth, once the group stage is final).
  const { groupWinner, groupRunner } = useMemo(() => {
    const gw: Record<string, string> = {}, gr: Record<string, string> = {};
    for (const m of matches) {
      for (const [slot, team] of [[m.homeSlot, m.homeTeam], [m.awaySlot, m.awayTeam]] as [Slot, string | null][]) {
        if (!team || !slot.group) continue;
        if (slot.type === 'GROUP_WINNER') gw[slot.group] = team;
        if (slot.type === 'GROUP_RUNNER_UP') gr[slot.group] = team;
      }
    }
    return { groupWinner: gw, groupRunner: gr };
  }, [matches]);

  // Compute each match's two participants in the user's own bracket (cascading
  // from their opponent + winner picks, falling back to real results).
  const participants = useMemo(() => {
    const memo = new Map<number, { home: string | null; away: string | null }>();
    const winnerTeam = (no: number): string | null => {
      const pick = myPicks[`M${no}`];
      if (pick) return pick;
      const m = byNo.get(no);
      if (m?.winner) return m.winner === 'home' ? m.homeTeam : m.awayTeam;
      return null;
    };
    const resolveSide = (slot: Slot, m: Match): string | null => {
      switch (slot.type) {
        case 'GROUP_WINNER': return slot.group ? groupWinner[slot.group] ?? null : null;
        case 'GROUP_RUNNER_UP': return slot.group ? groupRunner[slot.group] ?? null : null;
        case 'GROUP_THIRD': return myPicks[`OPP${m.matchNo}`] ?? m.awayTeam ?? null;
        case 'WINNER_OF': return slot.matchNo ? winnerTeam(slot.matchNo) : null;
        case 'RUNNER_UP_OF': {
          if (!slot.matchNo) return null;
          const p = compute(slot.matchNo); const w = winnerTeam(slot.matchNo);
          if (!w || !p.home || !p.away) return null;
          return w === p.home ? p.away : p.home;
        }
        default: return null;
      }
    };
    function compute(no: number): { home: string | null; away: string | null } {
      if (memo.has(no)) return memo.get(no)!;
      const m = byNo.get(no);
      if (!m) return { home: null, away: null };
      memo.set(no, { home: null, away: null }); // guard against cycles
      const r = { home: resolveSide(m.homeSlot, m), away: resolveSide(m.awaySlot, m) };
      memo.set(no, r);
      return r;
    }
    return compute;
  }, [matches, myPicks, byNo, groupWinner, groupRunner]);

  const requireAuth = () => {
    const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
    if (!isAuthenticated && !hasToken) { router.push('/auth/login?redirect=/predictions'); return false; }
    return true;
  };

  const savePick = async (key: string, team: string) => {
    if (!requireAuth()) return;
    setSaving(key);
    setMyPicks((p) => ({ ...p, [key]: team })); // optimistic
    try {
      await predictionAPI.pick(key, team);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Could not save your pick';
      toast.error(msg);
      load(); // resync on failure
    }
    setSaving(null);
  };

  const byRound = useMemo(() => {
    const g: Record<string, Match[]> = {};
    for (const m of matches) (g[m.round] ||= []).push(m);
    return ROUND_ORDER.filter((r) => g[r]?.length).map((r) => ({ round: r, label: g[r][0].roundLabel, items: g[r] }));
  }, [matches]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PredictionsHeader subtitle="Predict the opponent for each tie, then call every winner to the final. +3 for each correct pick." />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-3">{[...Array(6)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-28" />)}</div>
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
                <div className="space-y-3">
                  {items.map((m) => {
                    const p = participants(m.matchNo);
                    const showScore = m.status === 'live' || m.status === 'finished';
                    const needsOpponent = m.opponentMatch && !m.awayTeam && !m.locked;
                    const cands = candidates[m.matchNo] || [];
                    const oppPick = myPicks[`OPP${m.matchNo}`];
                    const winPick = myPicks[`M${m.matchNo}`];
                    const homeName = p.home || m.homeLabel;
                    const awayName = p.away || (oppPick ?? m.awayLabel);
                    const canPickWinner = !!p.home && !!p.away && !m.locked;
                    const realWinnerTeam = m.winner === 'home' ? m.homeTeam : m.winner === 'away' ? m.awayTeam : null;

                    return (
                      <div key={m.matchNo} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-2 text-[11px] text-gray-400">
                          <span>Match {m.matchNo}{m.venue ? ` · ${m.venue}` : ''}</span>
                          {m.status === 'live' ? <span className="inline-flex items-center gap-1 font-bold text-red-600"><CircleDot className="w-3 h-3" /> Live</span>
                            : m.status === 'finished' ? <span className="font-bold text-green-700">Final</span>
                            : <span>{formatDate(m.kickoffUtc, 'EEE, MMM d')}</span>}
                        </div>

                        {/* Two participants */}
                        {([['home', homeName, m.homeScore, p.home], ['away', awayName, m.awayScore, p.away]] as const).map(([side, name, score, resolved]) => {
                          const isWinPick = canPickWinner && winPick && winPick === resolved;
                          const isRealWinner = m.status === 'finished' && realWinnerTeam && realWinnerTeam === resolved;
                          return (
                            <button
                              key={side}
                              disabled={!canPickWinner || saving === `M${m.matchNo}`}
                              onClick={() => resolved && savePick(`M${m.matchNo}`, resolved)}
                              className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg my-1 text-left transition-colors ${
                                isWinPick ? 'bg-brand text-white' : isRealWinner ? 'bg-green-50' : 'bg-gray-50'
                              } ${canPickWinner ? 'hover:bg-blue-50 disabled:hover:bg-gray-50' : ''} ${!resolved ? 'opacity-60' : ''}`}
                            >
                              <span className={`truncate text-sm ${isWinPick ? 'font-bold' : resolved ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                                {name}
                                {isWinPick && <CheckCircle2 className="w-3.5 h-3.5 inline ml-1.5 -mt-0.5" />}
                              </span>
                              {showScore && <span className="font-extrabold text-sm flex-shrink-0">{score ?? 0}</span>}
                            </button>
                          );
                        })}

                        {/* Opponent prediction (third-place slot) */}
                        {needsOpponent && (
                          <div className="mt-3 pt-3 border-t border-gray-100">
                            <p className="text-[11px] font-semibold text-brand mb-2">Who will {p.home || m.homeLabel} face?</p>
                            {cands.length === 0 ? (
                              <p className="text-[11px] text-gray-400">Opponents appear once the group standings are in.</p>
                            ) : (
                              <div className="flex flex-wrap gap-1.5">
                                {cands.map((c) => (
                                  <button
                                    key={c.group}
                                    disabled={saving === `OPP${m.matchNo}`}
                                    onClick={() => savePick(`OPP${m.matchNo}`, c.team)}
                                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border-2 transition-colors disabled:opacity-60 ${
                                      oppPick === c.team ? 'border-brand bg-brand text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-brand hover:bg-blue-50'
                                    }`}
                                  >
                                    {c.team} <span className="opacity-60">({c.group})</span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {!canPickWinner && !needsOpponent && !showScore && (
                          <p className="text-[11px] text-gray-400 text-center mt-1">Pickable once both teams are set</p>
                        )}
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
