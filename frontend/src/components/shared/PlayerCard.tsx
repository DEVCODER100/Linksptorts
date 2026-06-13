'use client';

import Link from 'next/link';
import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { getInitials, getPhotoUrl } from '@/lib/utils';

export type ConnState = 'none' | 'pending' | 'connected' | 'incoming';

interface Props {
  profile: Record<string, unknown>;
  href: string;
  width?: string;        // tailwind width class for the card (defaults to full width of its grid cell)
  kind?: 'athlete' | 'coach';
  userId?: string;
  isOwn?: boolean;
  connState?: ConnState;
  onConnect?: (userId: string) => void;
}

/** Clean card: white box → inset rounded photo box → name / sport / location below. */
export default function PlayerCard({ profile: p, href, width = 'w-full', kind = 'athlete', userId, isOwn, connState, onConnect }: Props) {
  const [imgFailed, setImgFailed] = useState(false);
  const loc = (p.location as Record<string, string>) || {};
  const photo = getPhotoUrl((p.photo as string) || null);
  const name = (p.fullName as string) || (p.name as string) || (kind === 'coach' ? 'Coach' : 'Player');
  const fallbackLabel = kind === 'coach' ? 'Coach' : 'Athlete';
  const badge = ((p.position as string) || (p.primarySport as string) || (p.sportsSpecialization as string[])?.[0] || fallbackLabel);
  const sport = (p.primarySport as string) || (p.sportsSpecialization as string[])?.join(', ') || fallbackLabel;
  const location = [loc.city, loc.state].filter(Boolean).join(', ') || 'India';
  const showConnect = !isOwn && !!onConnect && !!userId;
  const showPhoto = !!photo && !imgFailed;

  return (
    <Link
      href={href}
      className={`block ${width} bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-2.5`}
    >
      {/* Inset photo box */}
      <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        {showPhoto ? (
          <img
            src={photo!}
            alt=""
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl sm:text-3xl font-bold text-brand/70">{getInitials(name)}</span>
          </div>
        )}
        <span className="absolute top-2 left-2 text-[9px] sm:text-[10px] font-bold text-white bg-brand/90 px-2 py-0.5 rounded-md capitalize shadow-sm">
          {badge.slice(0, 14)}
        </span>
      </div>

      {/* Info */}
      <div className="pt-2.5 px-0.5">
        <p className="font-semibold text-sm text-gray-900 truncate capitalize">{name.toLowerCase()}</p>
        <p className="text-xs text-gray-500 capitalize truncate">{sport}</p>
        <p className="text-[11px] text-gray-400 flex items-center gap-0.5 mt-0.5">
          <MapPin className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{location}</span>
        </p>
        {showConnect && (
          <button
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (!connState || connState === 'none') onConnect!(userId!); }}
            disabled={!!connState && connState !== 'none'}
            className={`mt-2.5 w-full text-xs font-semibold py-1.5 rounded-lg transition-colors ${
              connState === 'pending' ? 'bg-orange-100 text-orange-600 cursor-default' :
              connState === 'incoming' ? 'bg-amber-100 text-amber-700 cursor-default' :
              connState === 'connected' ? 'bg-green-100 text-green-700 cursor-default' :
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
