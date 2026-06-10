'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { profileAPI, connectionAPI, reviewAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials, formatDate, getPhotoUrl } from '@/lib/utils';
import { MapPin, UserPlus, CheckCircle, MessageCircle, ChevronLeft, Award, Briefcase, Loader2, Edit, Download, Share2, Star, Trash2, Flag } from 'lucide-react';
import toast from 'react-hot-toast';

// ── Star display / input ───────────────────────────────────────────
function Stars({ value, size = 'w-4 h-4', onSelect }: { value: number; size?: string; onSelect?: (n: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onSelect}
          onClick={() => onSelect?.(n)}
          className={onSelect ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
        >
          <Star className={`${size} ${n <= value ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  );
}

interface ReviewItem {
  _id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  reviewer?: { _id: string; username?: string; displayName?: string; photo?: string; role?: string };
}

export default function CoachProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated, profile: authProfile } = useAuthStore();
  const [profile, setProfile] = useState<Record<string, unknown> | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [isOwnProfileServer, setIsOwnProfileServer] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDownloadingCV, setIsDownloadingCV] = useState(false);

  // Reviews & rating
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [rating, setRating] = useState<{ averageRating: number; totalReviews: number }>({ averageRating: 0, totalReviews: 0 });
  const [formRating, setFormRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => { fetchProfile(); }, [id]);

  const fetchReviews = async (coachUserId: string) => {
    try {
      const [rRes, ratRes] = await Promise.all([
        reviewAPI.getReviews(coachUserId),
        reviewAPI.getRating(coachUserId),
      ]);
      setReviews(rRes.data.data || []);
      setRating(ratRes.data.data || { averageRating: 0, totalReviews: 0 });
    } catch {}
  };

  const myReview = reviews.find((r) => (r.reviewer?._id || '') === user?.id);

  const submitReview = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (formRating < 1) { toast.error('Please select a star rating'); return; }
    const coachUserId = ((profile?.userId as any)?._id || profile?.userId) as string;
    setSubmittingReview(true);
    try {
      if (myReview) {
        await reviewAPI.updateReview(myReview._id, { rating: formRating, comment: formComment.trim() });
        toast.success('Review updated');
      } else {
        await reviewAPI.addReview(coachUserId, { rating: formRating, comment: formComment.trim() });
        toast.success('Review submitted');
      }
      await fetchReviews(coachUserId);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to submit review');
    }
    setSubmittingReview(false);
  };

  const removeReview = async () => {
    if (!myReview) return;
    if (!window.confirm('Delete your review?')) return;
    const coachUserId = ((profile?.userId as any)?._id || profile?.userId) as string;
    try {
      await reviewAPI.deleteReview(myReview._id);
      setFormRating(0); setFormComment('');
      await fetchReviews(coachUserId);
      toast.success('Review deleted');
    } catch { toast.error('Failed to delete review'); }
  };

  // Pre-fill the form with the user's existing review (so they can edit it)
  useEffect(() => {
    if (myReview) { setFormRating(myReview.rating); setFormComment(myReview.comment || ''); }
  }, [myReview?._id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await profileAPI.getCoachProfile(id);
      const data = res.data.data;
      const coachData = data?.profile || data;
      setProfile(coachData);
      setIsOwnProfileServer(data?.isOwnProfile === true);
      if (isAuthenticated && data?.connectionStatus) {
        setConnectionStatus(data.connectionStatus);
        setConnectionId(data.connectionId || null);
      }
      const coachUserId = (coachData?.userId?._id || coachData?.userId) as string;
      if (coachUserId) fetchReviews(coachUserId);
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Profile not found';
      toast.error(msg);
      router.push('/search?type=coach');
    }
    setIsLoading(false);
  };

  const handleConnect = async () => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    if (isOwnProfile) return;
    setIsConnecting(true);
    try {
      const userId = (profile?.userId as Record<string, unknown>)?._id as string || profile?.userId as string;
      await connectionAPI.sendRequest(userId);
      setConnectionStatus('pending');
      toast.success('Connection request sent!');
    } catch { toast.error('Failed to send request'); }
    setIsConnecting(false);
  };

  const handleDownloadCV = async () => {
    setIsDownloadingCV(true);
    try {
      const res = await profileAPI.downloadCoachCV(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile?.fullName as string || 'coach'}_Coach_CV.pdf`.replace(/\s+/g, '_');
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download CV');
    }
    setIsDownloadingCV(false);
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (!profile) return null;

  const profileUserId = ((profile.userId as any)?._id || profile.userId as string)?.toString();
  const isOwnProfile = isOwnProfileServer
    || (!!authProfile && (
      (authProfile as any)._id?.toString() === (profile._id as string)?.toString()
      || (authProfile as any).profileUrl === profile.profileUrl
      || user?.id === profileUserId
    ));
  const loc = (profile.location as any) || {};
  const qualifications = (profile.qualifications as any[]) || [];
  const experience = (profile.experience as any[]) || [];
  const certifications = (profile.certifications as string[]) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div className="card p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-brand text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4 overflow-hidden">
                {getPhotoUrl(profile.photo as string) ? <img src={getPhotoUrl(profile.photo as string)!} alt="" className="w-full h-full object-cover" /> : getInitials(profile.fullName as string || 'C')}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{profile.fullName as string}</h1>
              {(profile.sportsSpecialization as string[])?.length > 0 && (
                <p className="text-brand font-medium mt-1">{(profile.sportsSpecialization as string[]).join(', ')}</p>
              )}
              {rating.totalReviews > 0 && (
                <div className="flex items-center justify-center gap-2 mt-2">
                  <Stars value={Math.round(rating.averageRating)} />
                  <span className="text-sm font-semibold text-gray-900">{rating.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({rating.totalReviews} review{rating.totalReviews > 1 ? 's' : ''})</span>
                </div>
              )}
              {loc?.city && (
                <p className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-2">
                  <MapPin className="w-3.5 h-3.5" />{loc.city}{loc.state ? `, ${loc.state}` : ''}
                </p>
              )}
              {profile.isAvailableForHire && (
                <span className="badge bg-green-100 text-green-700 mt-3 inline-block">Available for Hire</span>
              )}

              {isOwnProfile ? (
                <div className="flex flex-col gap-2 mt-4">
                  <Link href="/profile/edit" className="btn-secondary w-full flex items-center justify-center gap-2 py-2">
                    <Edit className="w-4 h-4" /> Edit Profile
                  </Link>
                  <button
                    onClick={handleDownloadCV}
                    disabled={isDownloadingCV}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-2"
                  >
                    {isDownloadingCV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Download My CV
                  </button>
                </div>
              ) : (
                <div className="flex gap-2 mt-4">
                  {connectionStatus === 'received_pending' ? (
                    <div className="flex gap-2 w-full">
                      <button
                        onClick={async () => {
                          try {
                            await connectionAPI.respondToRequest(connectionId!, 'accept');
                            setConnectionStatus('accepted');
                            toast.success(`Connection with ${profile.fullName} accepted!`);
                          } catch { toast.error('Failed to accept'); }
                        }}
                        className="btn-primary flex-1 py-2 text-sm"
                      >
                        Accept
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await connectionAPI.respondToRequest(connectionId!, 'reject');
                            setConnectionStatus(null);
                            toast.success('Connection rejected');
                          } catch { toast.error('Failed to reject'); }
                        }}
                        className="btn-secondary flex-1 py-2 text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  ) : connectionStatus === 'accepted' ? (
                    <button
                      onClick={async () => {
                        if (!window.confirm('Are you sure you want to disconnect?')) return;
                        setIsConnecting(true);
                        try {
                          await connectionAPI.withdrawConnection(connectionId!);
                          setConnectionStatus(null);
                          toast.success(`Disconnected from ${profile.fullName}`);
                        } catch { toast.error('Failed to disconnect'); }
                        setIsConnecting(false);
                      }}
                      disabled={isConnecting}
                      className="btn-secondary flex-1 flex items-center justify-center gap-1.5 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                    >
                      {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disconnect'}
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      disabled={isConnecting || !!connectionStatus}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                        connectionStatus === 'pending' ? 'bg-gray-100 text-gray-500 font-normal italic' : 'btn-primary font-semibold'
                      }`}
                    >
                      {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> :
                        connectionStatus === 'pending' ? 'Request Sent' :
                        <><UserPlus className="w-4 h-4" /> Connect</>}
                    </button>
                  )}
                  {connectionStatus === 'accepted' && (
                    <Link href={`/messages?userId=${profileUserId}`} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                    </Link>
                  )}
                </div>
              )}

              {/* CV / Share for non-own profiles */}
              {!isOwnProfile && (() => {
                const viewerRole = user?.role;
                const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
                if (viewerRole === 'organization') {
                  return (
                    <button
                      onClick={handleDownloadCV}
                      disabled={isDownloadingCV}
                      className="btn-secondary w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm"
                    >
                      {isDownloadingCV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download Coach CV
                    </button>
                  );
                }
                return (
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success('Profile link copied!'); }}
                    className="btn-secondary w-full mt-3 flex items-center justify-center gap-2 py-2 text-sm"
                  >
                    <Share2 className="w-4 h-4" /> Share Profile
                  </button>
                );
              })()}
            </div>

            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                {profile.availability && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Looking for Job</span>
                    <span className="font-medium text-gray-900">{
                      ({ looking: 'Actively looking', open: 'Open to opportunities', not_looking: 'Not looking' } as Record<string, string>)[profile.availability as string]
                      || (profile.availability as string).replace(/_/g, ' ')
                    }</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{profile.email as string}</span>
                  </div>
                )}
                {/* Phone number hidden for privacy/security */}
                {(profile.ageGroupsCoached as string[])?.length > 0 && (
                  <div>
                    <span className="text-gray-500 block mb-1">Age Groups</span>
                    <div className="flex flex-wrap gap-1">
                      {(profile.ageGroupsCoached as string[]).map((group) => (
                        <span key={group as string} className="badge bg-gray-100 text-gray-600">{group as string}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {certifications.length > 0 && (
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-brand" /> Certifications</h3>
                <ul className="space-y-1">
                  {certifications.map((c, i) => <li key={i} className="text-sm text-gray-600 flex items-center gap-2"><span className="w-1.5 h-1.5 bg-brand rounded-full" />{c as string}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="lg:col-span-2 space-y-4">
            {profile.aboutBio && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.aboutBio as string}</p>
              </div>
            )}

            {profile.coachingPhilosophy && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-2">Coaching Philosophy</h2>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{profile.coachingPhilosophy as string}</p>
              </div>
            )}

            {qualifications.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-brand" /> Certifications</h2>
                <div className="space-y-3">
                  {qualifications.map((q, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm text-gray-900">{q.name as string}</p>
                      <p className="text-xs text-gray-500">{q.issuer as string}{q.year ? ` · ${q.year as string}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {experience.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Briefcase className="w-5 h-5 text-brand" /> Experience</h2>
                <div className="space-y-3">
                  {experience.map((e, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm text-gray-900">{e.role as string}</p>
                      <p className="text-sm text-gray-600">{e.organization as string}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {e.startDate ? formatDate(e.startDate as string) : ''}{e.endDate ? ` – ${e.current ? 'Present' : formatDate(e.endDate as string)}` : e.current ? ' – Present' : ''}
                      </p>
                      {e.description && <p className="text-xs text-gray-600 mt-1">{e.description as string}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Ratings & Reviews ── */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" /> Ratings & Reviews
                </h2>
                {rating.totalReviews > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-gray-900">{rating.averageRating.toFixed(1)}</span>
                    <Stars value={Math.round(rating.averageRating)} />
                    <span className="text-xs text-gray-400">({rating.totalReviews})</span>
                  </div>
                )}
              </div>

              {/* Write / edit review (signed-in, not own profile) */}
              {!isOwnProfile && isAuthenticated && (
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <p className="text-sm font-medium text-gray-700 mb-2">{myReview ? 'Edit your review' : 'Rate this coach'}</p>
                  <Stars value={formRating} size="w-7 h-7" onSelect={setFormRating} />
                  <textarea
                    rows={3}
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Share your experience with this coach (optional)"
                    className="input-field mt-3"
                    maxLength={1000}
                  />
                  <div className="flex items-center gap-2 mt-3">
                    <button onClick={submitReview} disabled={submittingReview} className="btn-primary text-sm px-4 py-2 flex items-center gap-2">
                      {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                      {myReview ? 'Update Review' : 'Submit Review'}
                    </button>
                    {myReview && (
                      <button onClick={removeReview} className="btn-secondary text-sm px-4 py-2 flex items-center gap-2 text-red-600 hover:bg-red-50 border-red-200">
                        <Trash2 className="w-4 h-4" /> Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
              {!isAuthenticated && (
                <p className="text-sm text-gray-500 mb-4">
                  <Link href="/auth/login" className="text-brand hover:underline">Sign in</Link> to rate and review this coach.
                </p>
              )}

              {/* Reviews list */}
              {reviews.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r._id} className="border-b border-gray-50 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand/10 text-brand flex items-center justify-center text-xs font-bold overflow-hidden">
                            {getPhotoUrl(r.reviewer?.photo || null)
                              ? <img src={getPhotoUrl(r.reviewer?.photo || null)!} alt="" className="w-full h-full object-cover" />
                              : getInitials(r.reviewer?.displayName || r.reviewer?.username || 'U')}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{r.reviewer?.displayName || `@${r.reviewer?.username || 'user'}`}</p>
                            <p className="text-[11px] text-gray-400 capitalize">{r.reviewer?.role || ''} · {formatDate(r.createdAt)}</p>
                          </div>
                        </div>
                        <Stars value={r.rating} />
                      </div>
                      {r.comment && <p className="text-sm text-gray-600 mt-2 ml-10">{r.comment}</p>}
                      {isAuthenticated && (r.reviewer?._id !== user?.id) && (
                        <button
                          onClick={async () => { try { await reviewAPI.reportReview(r._id); toast.success('Review reported'); } catch (e: any) { toast.error(e?.response?.data?.error?.message || 'Failed to report'); } }}
                          className="text-[11px] text-gray-400 hover:text-red-500 flex items-center gap-1 mt-1.5 ml-10"
                        >
                          <Flag className="w-3 h-3" /> Report
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
