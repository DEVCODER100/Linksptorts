'use client';

import Link from 'next/link';
import { getInitials, getPhotoUrl } from '@/lib/utils';

export type ConnState = 'none' | 'pending' | 'connected' | 'incoming';

interface Props {
  profile: Record<string, unknown>;
  href: string;
  width?: string;        // tailwind width class for the card
  kind?: 'athlete' | 'coach';
  userId?: string;
  isOwn?: boolean;
  connState?: ConnState;
  onConnect?: (userId: string) => void;
}

/** Premium "FIFA-style" player/coach card (brand colours, no scout score). */
export default function PlayerCard({ profile: p, href, width = 'w-52', kind = 'athlete', userId, isOwn, connState, onConnect }: Props) {
  const loc = (p.location as Record<string, string>) || {};
  const photo = getPhotoUrl((p.photo as string) || null);
  const name = (p.fullName as string) || (p.name as string) || (kind === 'coach' ? 'Coach' : 'Player');
  const fallbackLabel = kind === 'coach' ? 'Coach' : 'Athlete';
  const pos = ((p.position as string) || (p.primarySport as string) || (p.sportsSpecialization as string[])?.[0] || fallbackLabel).toUpperCase();
  const sport = (p.primarySport as string) || (p.sportsSpecialization as string[])?.join(', ') || fallbackLabel;
  const showConnect = !isOwn && !!onConnect && !!userId;

  return (
    <Link href={href} className={`flex-shrink-0 ${width} rounded-2xl overflow-hidden bg-slate-900 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all`}>
      {/* Photo / header */}
      <div className="relative h-52 bg-gradient-to-b from-brand to-slate-900 flex items-center justify-center overflow-hidden">
        <span className="absolute top-3 left-3 z-10 text-[10px] font-bold text-white bg-brand px-2 py-0.5 rounded-md shadow">{pos.slice(0, 10)}</span>
        {photo
          ? <img src={photo} alt={name} className="w-full h-full object-cover" />
          : <span className="text-white/90 text-5xl font-extrabold">{getInitials(name)}</span>}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-900 to-transparent" />
      </div>
      {/* Body */}
      <div className="p-4">
        <p className="font-bold text-white text-sm uppercase truncate">{name}</p>
        <p className="text-xs text-blue-200/80 truncate">{sport}</p>
        <p className="text-[11px] text-gray-400 truncate">{[loc.city, loc.state].filter(Boolean).join(', ') || 'India'}</p>
        {showConnect && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!connState || connState === 'none') onConnect!(userId!); }}
            disabled={!!connState && connState !== 'none'}
            className={`mt-3 w-full text-xs font-semibold py-1.5 rounded-lg transition-colors ${
              connState === 'pending' ? 'bg-white/10 text-blue-200 cursor-default' :
              connState === 'incoming' ? 'bg-amber-400/20 text-amber-200 cursor-default' :
              connState === 'connected' ? 'bg-green-500/20 text-green-300 cursor-default' :
              'bg-brand text-white hover:bg-brand-dark'
            }`}
          >
            {connState === 'pending' ? 'Pending' : connState === 'incoming' ? 'Respond' : connState === 'connected' ? '✓ Connected' : 'Connect'}
          </button>
        )}
      </div>
    </Link>
  );
}
