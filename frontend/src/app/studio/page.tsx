'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Navbar from '@/components/layout/Navbar';
import { Camera, Upload, Download, Plus, Trash2, Clock, Type, X, ImageIcon, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const SIZE = 1080; // square export resolution

const FRAMES = [
  { id: 'none', name: 'None' },
  { id: 'matchday', name: 'Match Day' },
  { id: 'gold', name: 'Champion' },
  { id: 'polaroid', name: 'Polaroid' },
  { id: 'neon', name: 'Neon' },
  { id: 'stadium', name: 'Stadium' },
];

const FONTS = ['Bebas Neue', 'Anton', 'Oswald', 'Rajdhani', 'Pacifico', 'Inter'];
const COLORS = ['#ffffff', '#000000', '#f97316', '#22c55e', '#3b82f6', '#eab308', '#ec4899', '#ef4444'];
const QUICK_TEXTS = ['Watching this LIVE! 🔥', 'Match Day ⚽', 'Big game tonight 🏟️', 'Vamos! 💪', 'GOAL!! 🎯', 'My team, my pride 🦁'];

interface TextItem { id: number; text: string; x: number; y: number; font: string; size: number; color: string; }

export default function StudioPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [mode, setMode] = useState<'source' | 'camera' | 'edit'>('source');
  const [hasImage, setHasImage] = useState(false);
  const [frameId, setFrameId] = useState('matchday');
  const [texts, setTexts] = useState<TextItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [showTime, setShowTime] = useState(true);
  const [timeLabel, setTimeLabel] = useState('');
  const [fontsReady, setFontsReady] = useState(false);
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null);

  // Pre-load the display fonts so they render on the canvas
  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all(FONTS.map((f) => (document as any).fonts.load(`60px '${f}'`)));
        await (document as any).fonts.ready;
      } catch {}
      setFontsReady(true);
    };
    load();
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const stampNow = () => {
    const now = new Date();
    setTimeLabel(now.toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' }));
  };

  // ── Source: camera ──
  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      setMode('camera');
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play().catch(() => {}); } }, 50);
    } catch {
      toast.error('Could not access camera. You can upload a photo instead.');
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    if (!video) return;
    const off = document.createElement('canvas');
    off.width = video.videoWidth || SIZE;
    off.height = video.videoHeight || SIZE;
    off.getContext('2d')!.drawImage(video, 0, 0, off.width, off.height);
    loadImageFromUrl(off.toDataURL('image/jpeg', 0.95));
    stopCamera();
  };

  // ── Source: upload ──
  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please choose an image'); return; }
    const reader = new FileReader();
    reader.onload = () => loadImageFromUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const loadImageFromUrl = (url: string) => {
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      setHasImage(true);
      stampNow();
      setMode('edit');
    };
    img.src = url;
  };

  // ── Drawing ──
  const drawImageCover = (ctx: CanvasRenderingContext2D, img: HTMLImageElement, W: number, H: number) => {
    const r = Math.max(W / img.width, H / img.height);
    const w = img.width * r, h = img.height * r;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, id: string, W: number, H: number) => {
    ctx.save();
    if (id === 'matchday') {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#6366f1'); g.addColorStop(0.5, '#ec4899'); g.addColorStop(1, '#f97316');
      ctx.lineWidth = 34; ctx.strokeStyle = g; ctx.strokeRect(17, 17, W - 34, H - 34);
      const grad = ctx.createLinearGradient(0, H - 200, 0, H);
      grad.addColorStop(0, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0.75)');
      ctx.fillStyle = grad; ctx.fillRect(34, H - 220, W - 68, 186);
    } else if (id === 'gold') {
      ctx.lineWidth = 14; ctx.strokeStyle = '#facc15'; ctx.strokeRect(24, 24, W - 48, H - 48);
      ctx.lineWidth = 4; ctx.strokeStyle = '#b8860b'; ctx.strokeRect(48, 48, W - 96, H - 96);
      ctx.fillStyle = '#facc15';
      const c = 70;
      [[24, 24, 1, 1], [W - 24, 24, -1, 1], [24, H - 24, 1, -1], [W - 24, H - 24, -1, -1]].forEach(([x, y, sx, sy]) => {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + c * sx, y); ctx.lineTo(x, y + c * sy); ctx.closePath(); ctx.fill();
      });
    } else if (id === 'polaroid') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, 48); ctx.fillRect(0, 0, 48, H); ctx.fillRect(W - 48, 0, 48, H); ctx.fillRect(0, H - 150, W, 150);
    } else if (id === 'neon') {
      const len = 150, off = 30;
      const drawL = (x1: number, y1: number, x2: number, y2: number, col: string) => {
        ctx.strokeStyle = col; ctx.lineWidth = 12; ctx.shadowColor = col; ctx.shadowBlur = 24;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      };
      drawL(off, off + len, off, off, '#22d3ee'); drawL(off, off, off + len, off, '#22d3ee');
      drawL(W - off - len, off, W - off, off, '#ec4899'); drawL(W - off, off, W - off, off + len, '#ec4899');
      drawL(off, H - off - len, off, H - off, '#ec4899'); drawL(off, H - off, off + len, H - off, '#ec4899');
      drawL(W - off - len, H - off, W - off, H - off, '#22d3ee'); drawL(W - off, H - off, W - off, H - off - len, '#22d3ee');
      ctx.shadowBlur = 0;
    } else if (id === 'stadium') {
      const top = ctx.createLinearGradient(0, 0, 0, 200);
      top.addColorStop(0, 'rgba(0,0,0,0.7)'); top.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = top; ctx.fillRect(0, 0, W, 200);
      const bot = ctx.createLinearGradient(0, H - 240, 0, H);
      bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,0.8)');
      ctx.fillStyle = bot; ctx.fillRect(0, H - 240, W, 240);
      ctx.fillStyle = '#f97316'; ctx.fillRect(0, H - 18, W, 18); ctx.fillStyle = '#3b82f6'; ctx.fillRect(0, 0, W, 12);
    }
    ctx.restore();
  };

  const drawText = (ctx: CanvasRenderingContext2D, t: TextItem, selected: boolean) => {
    ctx.save();
    ctx.font = `${t.size}px '${t.font}'`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
    if (selected) {
      const w = ctx.measureText(t.text).width;
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 2; ctx.setLineDash([8, 6]);
      ctx.strokeRect(t.x - w / 2 - 16, t.y - t.size / 2 - 10, w + 32, t.size + 20);
      ctx.setLineDash([]);
      ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = 10;
    }
    ctx.fillStyle = t.color; ctx.fillText(t.text, t.x, t.y);
    ctx.restore();
  };

  const drawTimestamp = (ctx: CanvasRenderingContext2D, label: string, W: number, H: number) => {
    if (!label) return;
    ctx.save();
    ctx.font = `600 30px 'Rajdhani'`;
    const pad = 18, tw = ctx.measureText(label).width;
    const bw = tw + pad * 2 + 34, bh = 52, x = W - bw - 28, y = H - bh - 28;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); (ctx as any).roundRect?.(x, y, bw, bh, 12); ctx.fill();
    ctx.fillStyle = '#f97316'; ctx.beginPath(); ctx.arc(x + 24, y + bh / 2, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText(label, x + 40, y + bh / 2 + 2);
    ctx.restore();
  };

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imgRef.current) return;
    const ctx = canvas.getContext('2d')!;
    canvas.width = SIZE; canvas.height = SIZE;
    ctx.fillStyle = '#0f172a'; ctx.fillRect(0, 0, SIZE, SIZE);
    drawImageCover(ctx, imgRef.current, SIZE, SIZE);
    drawFrame(ctx, frameId, SIZE, SIZE);
    texts.forEach((t) => drawText(ctx, t, t.id === selectedId));
    if (showTime) drawTimestamp(ctx, timeLabel, SIZE, SIZE);
  }, [frameId, texts, selectedId, showTime, timeLabel]);

  useEffect(() => { if (mode === 'edit' && fontsReady) redraw(); }, [mode, fontsReady, redraw]);

  // ── Text helpers ──
  const addText = (preset?: string) => {
    const id = Date.now();
    setTexts((prev) => [...prev, { id, text: preset || 'Your text here', x: SIZE / 2, y: SIZE / 2, font: 'Bebas Neue', size: 88, color: '#ffffff' }]);
    setSelectedId(id);
  };
  const updateText = (id: number, patch: Partial<TextItem>) => setTexts((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  const removeText = (id: number) => { setTexts((prev) => prev.filter((t) => t.id !== id)); if (selectedId === id) setSelectedId(null); };
  const selected = texts.find((t) => t.id === selectedId) || null;

  // ── Canvas drag to move text ──
  const toCanvasCoords = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * SIZE, y: ((e.clientY - rect.top) / rect.height) * SIZE };
  };
  const onPointerDown = (e: React.PointerEvent) => {
    const { x, y } = toCanvasCoords(e);
    const ctx = canvasRef.current!.getContext('2d')!;
    for (let i = texts.length - 1; i >= 0; i--) {
      const t = texts[i];
      ctx.font = `${t.size}px '${t.font}'`;
      const w = ctx.measureText(t.text).width;
      if (x >= t.x - w / 2 - 16 && x <= t.x + w / 2 + 16 && y >= t.y - t.size / 2 - 10 && y <= t.y + t.size / 2 + 10) {
        setSelectedId(t.id); dragRef.current = { id: t.id, dx: x - t.x, dy: y - t.y };
        canvasRef.current!.setPointerCapture(e.pointerId);
        return;
      }
    }
    setSelectedId(null);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const { x, y } = toCanvasCoords(e);
    updateText(dragRef.current.id, { x: x - dragRef.current.dx, y: y - dragRef.current.dy });
  };
  const onPointerUp = () => { dragRef.current = null; };

  // ── Download ──
  const download = () => {
    const prevSel = selectedId; setSelectedId(null);
    setTimeout(() => {
      redraw();
      canvasRef.current!.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `linksports-moment-${Date.now()}.png`; a.click();
        URL.revokeObjectURL(url);
        toast.success('Saved! 🎉');
        setSelectedId(prevSel);
      }, 'image/png');
    }, 30);
  };

  const reset = () => { imgRef.current = null; setHasImage(false); setTexts([]); setSelectedId(null); setMode('source'); };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl moments-btn flex items-center justify-center text-white"><Camera className="w-5 h-5" /></div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Match Moments</h1>
            <p className="text-sm text-gray-500">Snap or upload a photo, add fancy frames & text, then download to share.</p>
          </div>
        </div>

        {/* ── SOURCE PICKER ── */}
        {mode === 'source' && (
          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl">
            <button onClick={openCamera} className="card p-8 flex flex-col items-center gap-3 hover:shadow-md transition-shadow border-2 border-dashed border-gray-200 hover:border-brand">
              <div className="w-16 h-16 rounded-2xl moments-btn flex items-center justify-center text-white"><Camera className="w-8 h-8" /></div>
              <p className="font-semibold text-gray-900">Take a Photo</p>
              <p className="text-xs text-gray-500 text-center">Use your camera to capture the moment</p>
            </button>
            <label className="card p-8 flex flex-col items-center gap-3 hover:shadow-md transition-shadow border-2 border-dashed border-gray-200 hover:border-brand cursor-pointer">
              <div className="w-16 h-16 rounded-2xl bg-gray-900 flex items-center justify-center text-white"><Upload className="w-8 h-8" /></div>
              <p className="font-semibold text-gray-900">Upload a Photo</p>
              <p className="text-xs text-gray-500 text-center">Pick an image from your device</p>
              <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
            </label>
          </div>
        )}

        {/* ── CAMERA ── */}
        {mode === 'camera' && (
          <div className="max-w-xl">
            <div className="rounded-2xl overflow-hidden bg-black aspect-square flex items-center justify-center">
              <video ref={videoRef} playsInline muted className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-center gap-3 mt-4">
              <button onClick={() => { stopCamera(); setMode('source'); }} className="btn-secondary px-5 py-2.5">Cancel</button>
              <button onClick={capturePhoto} className="btn-primary px-8 py-2.5 flex items-center gap-2"><Camera className="w-4 h-4" /> Capture</button>
            </div>
          </div>
        )}

        {/* ── EDITOR ── */}
        {mode === 'edit' && hasImage && (
          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            {/* Canvas */}
            <div className="flex flex-col items-center">
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                className="w-full max-w-[520px] aspect-square rounded-2xl shadow-lg touch-none cursor-move bg-slate-900"
              />
              <p className="text-xs text-gray-400 mt-2">Tip: tap a text to select it, then drag to move it around.</p>
              <div className="flex gap-3 mt-4">
                <button onClick={reset} className="btn-secondary px-5 py-2.5 flex items-center gap-2"><RefreshCw className="w-4 h-4" /> New Photo</button>
                <button onClick={download} className="btn-primary px-8 py-2.5 flex items-center gap-2"><Download className="w-4 h-4" /> Download</button>
              </div>
            </div>

            {/* Controls */}
            <div className="space-y-5">
              {/* Frames */}
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-brand" /> Frames</h3>
                <div className="grid grid-cols-3 gap-2">
                  {FRAMES.map((f) => (
                    <button key={f.id} onClick={() => setFrameId(f.id)}
                      className={`py-2 px-1 rounded-lg text-xs font-medium border transition-colors ${frameId === f.id ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-200 hover:border-brand'}`}>
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timestamp */}
              <div className="card p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-brand" />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">Timestamp</p>
                    <p className="text-xs text-gray-400">{timeLabel}</p>
                  </div>
                </div>
                <button onClick={() => setShowTime((s) => !s)} className={`relative w-11 h-6 rounded-full transition-colors ${showTime ? 'bg-brand' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${showTime ? 'translate-x-5' : ''}`} />
                </button>
              </div>

              {/* Text */}
              <div className="card p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2"><Type className="w-4 h-4 text-brand" /> Text</h3>
                  <button onClick={() => addText()} className="text-xs text-brand hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add</button>
                </div>

                {/* Quick captions */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {QUICK_TEXTS.map((q) => (
                    <button key={q} onClick={() => addText(q)} className="text-[11px] px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-brand">{q}</button>
                  ))}
                </div>

                {texts.length === 0 && <p className="text-xs text-gray-400 text-center py-2">No text yet — add a caption above.</p>}

                {/* Text list */}
                <div className="space-y-2">
                  {texts.map((t) => (
                    <button key={t.id} onClick={() => setSelectedId(t.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 border ${selectedId === t.id ? 'border-brand bg-blue-50' : 'border-gray-100 hover:bg-gray-50'}`}>
                      <span className="truncate" style={{ fontFamily: t.font }}>{t.text || '(empty)'}</span>
                      <Trash2 className="w-3.5 h-3.5 text-gray-400 hover:text-red-500 flex-shrink-0" onClick={(e) => { e.stopPropagation(); removeText(t.id); }} />
                    </button>
                  ))}
                </div>

                {/* Selected text editor */}
                {selected && (
                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                    <input className="input-field" value={selected.text} onChange={(e) => updateText(selected.id, { text: e.target.value })} placeholder="Type your text..." />
                    <div>
                      <label className="text-[11px] text-gray-400">Font</label>
                      <select className="input-field" value={selected.font} onChange={(e) => updateText(selected.id, { font: e.target.value })}>
                        {FONTS.map((f) => <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400">Size — {selected.size}px</label>
                      <input type="range" min={36} max={200} value={selected.size} onChange={(e) => updateText(selected.id, { size: Number(e.target.value) })} className="w-full accent-brand" />
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400">Colour</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {COLORS.map((c) => (
                          <button key={c} onClick={() => updateText(selected.id, { color: c })}
                            className={`w-7 h-7 rounded-full border-2 ${selected.color === c ? 'border-brand ring-2 ring-brand/30' : 'border-gray-200'}`}
                            style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                    <button onClick={() => removeText(selected.id)} className="text-xs text-red-500 hover:underline flex items-center gap-1"><X className="w-3 h-3" /> Remove this text</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
