import React from 'react';

export default function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center ${className}`}>
      <img
        src="/logo.png"
        alt="LinkSports.in"
        className="h-14 sm:h-16 w-auto object-contain -my-2"
      />
    </div>
  );
}
