'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import PredictionsHeader from '@/components/predictions/PredictionsHeader';
import { predictionAPI } from '@/lib/api';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface MyItem {
  key: string;
  pickTeam: string;
  points: number | null;
  settled: boolean;
}

// "M79" → "Match 79 winner", "OPP79" → "Match 79 opponent"
const describeKey = (key: string) => {
  const opp = key.startsWith('OPP');
  const no = key.replace(/^(OPP|M)/, '');
  return opp ? `Match ${no} · opponent` : `Match ${no} · winner`;
};

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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Total points</p>
            <p className="text-3xl font-extrabold text-brand">{total}</p>
          </div>
          <p className="text-xs text-gray-400 text-right">+3 for each correct call<br />0 otherwise</p>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 animate-pulse h-16" />)}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No predictions yet</h3>
            <p className="text-gray-500 text-sm mb-4">Picks open soon on the bracket page.</p>
            <Link href="/predictions" className="btn-primary inline-flex text-sm">View the Bracket</Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
            {items.map((i) => (
              <div key={i.key} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 truncate">{i.pickTeam}</p>
                  <p className="text-[11px] text-gray-400">{describeKey(i.key)}</p>
                </div>
                {i.settled ? (
                  i.points === 3 ? (
                    <span className="inline-flex items-center gap-1 font-bold text-green-700 text-sm"><CheckCircle2 className="w-4 h-4" /> +3</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-gray-400 text-sm"><XCircle className="w-4 h-4" /> 0</span>
                  )
                ) : (
                  <span className="text-orange-500 font-semibold text-xs">Pending</span>
                )}
              </div>
            ))}
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
