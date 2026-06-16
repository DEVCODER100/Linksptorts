'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import PredictionsHeader from '@/components/predictions/PredictionsHeader';
import { predictionAPI } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

interface Row {
  rank: number;
  userId: string;
  name: string;
  totalPoints: number;
  correct: number;
  predictions: number;
  isMe: boolean;
}

const medal = (rank: number) => (rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null);

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await predictionAPI.getLeaderboard();
        setRows(res.data.data || []);
      } catch {
        toast.error('Could not load the leaderboard');
      }
      setIsLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <PredictionsHeader subtitle="Every member ranked by points. Get your calls right to rise up the table." />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse h-14" />)}</div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <Trophy className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">No predictions yet</h3>
            <p className="text-gray-500 text-sm">Be the first to make a pick and top the table.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
            {rows.map((r) => (
              <div key={r.userId} className={`flex items-center gap-3 px-4 py-3 ${r.isMe ? 'bg-blue-50/60' : ''}`}>
                <span className="w-7 text-center font-bold text-gray-500 flex-shrink-0">{medal(r.rank) || r.rank}</span>
                <span className="w-9 h-9 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold flex-shrink-0">{getInitials(r.name)}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-gray-900 truncate">{r.name}{r.isMe && <span className="ml-1.5 text-[10px] font-bold text-brand bg-blue-100 px-1.5 py-0.5 rounded">You</span>}</p>
                  <p className="text-[11px] text-gray-400">{r.correct} correct · {r.predictions} picks</p>
                </div>
                <span className="font-extrabold text-brand flex-shrink-0">{r.totalPoints}<span className="text-[10px] font-medium text-gray-400 ml-0.5">pts</span></span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
