'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import PredictionsHeader from '@/components/predictions/PredictionsHeader';
import { predictionAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

type Pick = 'HOME' | 'DRAW' | 'AWAY';

interface MyItem {
  predictionId: string;
  matchId: string;
  stage: string;
  groupLabel: string | null;
  homeTeam: string;
  awayTeam: string;
  kickoffUtc: string;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  pick: Pick;
  points: number | null;
  settled: boolean;
}

const pickLabel = (i: MyItem) => (i.pick === 'DRAW' ? 'Draw' : i.pick === 'HOME' ? i.homeTeam : i.awayTeam);

function MyPredictionsContent() {
  const [items, setItems] = useState<MyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await predictionAPI.getMine();
        setItems(res.data.data.items || []);
        setTotal(res.data.data.totalPoints || 0);
      } catch {
        toast.error('Could not load your predictions');
      }
      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PredictionsHeader />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Total points */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total points</p>
            <p className="text-3xl font-extrabold text-brand">{total}</p>
          </div>
          <p className="text-xs text-gray-400 text-right">+3 for each correct result<br />0 otherwise</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-20" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No predictions yet</h3>
            <p className="text-gray-500 text-sm mb-4">Make your first pick on the matches page.</p>
            <Link href="/predictions" className="btn-primary inline-flex text-sm">Go to Matches</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((i) => {
              const showScore = i.status === 'live' || i.status === 'finished';
              return (
                <div key={i.predictionId} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <span className="font-bold text-sm text-gray-900 flex-1 text-right truncate">{i.homeTeam}</span>
                    <span className="flex-shrink-0 min-w-[3rem] text-center">
                      {showScore ? <span className="font-extrabold text-gray-900">{i.homeScore ?? 0} – {i.awayScore ?? 0}</span> : <span className="text-xs font-bold text-gray-400">VS</span>}
                    </span>
                    <span className="font-bold text-sm text-gray-900 flex-1 truncate">{i.awayTeam}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">{formatDate(i.kickoffUtc, 'MMM d · h:mm a')}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-600">Your pick: <span className="font-semibold text-gray-900">{pickLabel(i)}</span></span>
                      {i.settled ? (
                        i.points === 3 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-green-700"><CheckCircle2 className="w-4 h-4" /> +3</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-gray-400"><XCircle className="w-4 h-4" /> 0</span>
                        )
                      ) : (
                        <span className="text-orange-500 font-semibold">Pending</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function MyPredictionsPage() {
  return (
    <AuthGuard>
      <MyPredictionsContent />
    </AuthGuard>
  );
}
