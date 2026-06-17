'use client';

import { useEffect, useRef } from 'react';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';

// The interactive 12-pool World Cup bracket predictor is a self-contained page
// (its own Tailwind/FontAwesome). We embed it untouched via an iframe so none of
// its logic changes, and auto-size the frame to its content (same-origin).
function PredictorContent() {
  const ref = useRef<HTMLIFrameElement>(null);

  const fit = () => {
    const f = ref.current;
    if (!f) return;
    try {
      const h = f.contentWindow?.document?.body?.scrollHeight;
      if (h) f.style.height = `${h}px`;
    } catch { /* cross-origin guard — not expected for same-origin */ }
  };

  useEffect(() => {
    // Re-measure periodically since the bracket grows/shrinks as picks are made.
    const id = setInterval(fit, 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <iframe
        ref={ref}
        src="/predictor.html"
        title="World Cup Bracket Predictor"
        onLoad={fit}
        className="w-full border-0 block"
        style={{ minHeight: '85vh' }}
      />
    </div>
  );
}

// Predicting requires an account — AuthGuard sends signed-out users to login
// (which links to register), then back to /predictor.
export default function PredictorPage() {
  return (
    <AuthGuard>
      <PredictorContent />
    </AuthGuard>
  );
}
