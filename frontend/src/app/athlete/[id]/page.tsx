'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { profileAPI, connectionAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate, getInitials, getPhotoUrl } from '@/lib/utils';
import { MapPin, Trophy, Calendar, UserPlus, CheckCircle, MessageCircle, ChevronLeft, Medal, Star, Loader2, Edit, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AthleteProfilePage() {
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

  useEffect(() => { fetchProfile(); }, [id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await profileAPI.getAthleteProfile(id);
      const data = res.data.data;
      setProfile(data?.profile || data);
      setIsOwnProfileServer(data?.isOwnProfile === true);
      if (isAuthenticated && data?.connectionStatus) {
        setConnectionStatus(data.connectionStatus);
        setConnectionId(data.connectionId || null);
      }
    } catch (e: any) {
      const msg = e.response?.data?.error?.message || 'Profile not found';
      toast.error(msg);
      router.push('/search');
    }
    setIsLoading(false);
  };

  const handleDownloadCV = async () => {
    setIsDownloadingCV(true);
    try {
      const res = await profileAPI.downloadAthleteCV(id);
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile?.fullName as string || 'athlete'}_Sports_CV.pdf`.replace(/\s+/g, '_');
      link.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download CV');
    }
    setIsDownloadingCV(false);
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
    } catch (e: unknown) {
      toast.error((e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to send request');
    }
    setIsConnecting(false);
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
  const achievements = (profile.achievements as any[]) || [];
  const tournaments = (profile.tournaments as any[]) || [];
  const education = (profile.education as any[]) || [];
  const playingHistory = (profile.playingHistory as any[]) || [];
  const media = (profile.media as any[]) || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left sidebar */}
          <div className="space-y-4">
            {/* Profile card */}
            <div className="card p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-brand text-white flex items-center justify-center text-3xl font-bold mx-auto mb-4 overflow-hidden">
                {getPhotoUrl(profile.photo as string) ? (
                  <img
                    src={getPhotoUrl(profile.photo as string)!}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement!.textContent = getInitials(profile.fullName as string || 'A');
                    }}
                  />
                ) : (
                  getInitials(profile.fullName as string || 'A')
                )}
              </div>
              <h1 className="text-xl font-bold text-gray-900">{profile.fullName as string}</h1>
              {profile.username && (
                <p className="text-sm text-gray-400 mt-0.5">@{profile.username as string}</p>
              )}
              {profile.primarySport && <p className="text-brand font-medium mt-1">{profile.primarySport as string}</p>}
              {loc?.city && (
                <p className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-2">
                  <MapPin className="w-3.5 h-3.5" />{loc.city}{loc.state ? `, ${loc.state}` : ''}
                </p>
              )}
              {profile.availabilityStatus && (
                <span className="badge bg-green-100 text-green-700 mt-3 inline-block">
                  {(profile.availabilityStatus as string).replace(/_/g, ' ')}
                </span>
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
                  <button
                    onClick={() => {
                      const url = window.location.href;
                      if (navigator.share) {
                        navigator.share({ title: profile.fullName as string, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success('Profile link copied!');
                      }
                    }}
                    className="btn-secondary w-full flex items-center justify-center gap-2 py-2"
                  >
                    <Share2 className="w-4 h-4" /> Share Profile
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
                    <Link href={`/messages?userId=${profileUserId}`} className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <MessageCircle className="w-5 h-5 text-gray-600" />
                    </Link>
                  )}
                </div>
              )}

              {/* CV download + Share for non-own profiles */}
              {!isOwnProfile && (
                <div className="flex flex-col gap-2 mt-3">
                  {(user?.role === 'organization' ||
                    ((user?.role === 'coach' || user?.role === 'professional') && connectionStatus === 'accepted')) && (
                    <button
                      onClick={handleDownloadCV}
                      disabled={isDownloadingCV}
                      className="btn-secondary w-full flex items-center justify-center gap-2 py-2 text-sm"
                    >
                      {isDownloadingCV ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Download Sports CV
                    </button>
                  )}
                  <button
                    onClick={() => {
                      const url = window.location.href;
                      if (navigator.share) {
                        navigator.share({ title: profile.fullName as string, url });
                      } else {
                        navigator.clipboard.writeText(url);
                        toast.success('Profile link copied!');
                      }
                    }}
                    className="btn-secondary w-full flex items-center justify-center gap-2 py-2 text-sm"
                  >
                    <Share2 className="w-4 h-4" /> Share Profile
                  </button>
                </div>
              )}
            </div>

            {/* Connection stats */}
            <div className="card p-4">
              <div className="grid grid-cols-3 divide-x divide-gray-100 text-center">
                <div className="px-2">
                  <p className="font-bold text-gray-900 text-lg">{(profile.connectionCount as number) || 0}</p>
                  <p className="text-gray-500 text-xs">Connections</p>
                </div>
                <div className="px-2">
                  <p className="font-bold text-gray-900 text-lg">{(profile.followerCount as number) || 0}</p>
                  <p className="text-gray-500 text-xs">Followers</p>
                </div>
                <div className="px-2">
                  <p className="font-bold text-gray-900 text-lg">{achievements.length}</p>
                  <p className="text-gray-500 text-xs">Achievements</p>
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Details</h3>
              <div className="space-y-2 text-sm">
                {((profile.dob || profile.dateOfBirth) as string | undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Age</span>
                    <span className="font-medium text-gray-900">
                      {Math.floor((Date.now() - new Date((profile.dob || profile.dateOfBirth) as string).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} years
                    </span>
                  </div>
                )}
                {(profile.gender as string | undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Gender</span>
                    <span className="font-medium text-gray-900 capitalize">{profile.gender as string}</span>
                  </div>
                )}
                {(profile.email as string | undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{profile.email as string}</span>
                  </div>
                )}
                {(profile.phone as string | undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mobile</span>
                    <span className="font-medium text-gray-900">{profile.phone as string}</span>
                  </div>
                )}
                {(profile.experienceLevel as string | undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Level</span>
                    <span className="font-medium text-gray-900 capitalize">{(profile.experienceLevel as string).replace(/_/g, ' ')}</span>
                  </div>
                )}
                {(profile.isParaAthlete as boolean | undefined) && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Para Athlete</span>
                    <span className="badge bg-purple-100 text-purple-700">Yes</span>
                  </div>
                )}
                {(profile.secondarySports as string[])?.length > 0 && (
                  <div>
                    <span className="text-gray-500 block mb-1">Sports</span>
                    <div className="flex flex-wrap gap-1">
                      {(profile.secondarySports as string[]).map((s) => (
                        <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Social links */}
            {profile.socialLinks && Object.values(profile.socialLinks as Record<string, string>).some(Boolean) && (
              <div className="card p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Social Links</h3>
                <div className="space-y-2">
                  {Object.entries(profile.socialLinks as Record<string, string>).filter(([, v]) => v).map(([k, v]) => (
                    <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-brand hover:underline capitalize">
                      {k}: {v}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {/* About (Tagline & Bio) */}
            {(profile.tagline || profile.aboutBio) && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-2">About</h2>
                {profile.tagline && <p className="text-brand font-medium mb-2">{profile.tagline as string}</p>}
                {profile.aboutBio && <p className="text-sm text-gray-600 whitespace-pre-wrap">{(profile.aboutBio as string).replace(/\\r\\n/g, '\n').replace(/\\n/g, '\n')}</p>}
              </div>
            )}

            {/* Achievements */}
            {achievements.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-brand" /> Achievements
                </h2>
                <div className="space-y-3">
                  {achievements.map((a, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Medal className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">{a.title as string}</p>
                        {a.year && <p className="text-xs text-gray-500">{a.year as string} {a.level ? `· ${a.level}` : ''}</p>}
                        {a.description && <p className="text-xs text-gray-600 mt-1">{a.description as string}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tournaments */}
            {tournaments.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-brand" /> Tournaments
                </h2>
                <div className="space-y-3">
                  {tournaments.map((t, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between">
                        <p className="font-medium text-sm text-gray-900">{t.name as string}</p>
                        {t.result && <span className="badge bg-green-100 text-green-700">{t.result as string}</span>}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {t.sport as string} {t.year ? `· ${t.year}` : ''} {t.level ? `· ${t.level}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Playing History */}
            {playingHistory.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Playing History</h2>
                <div className="space-y-3">
                  {playingHistory.map((h, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <Calendar className="w-5 h-5 text-brand flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-sm text-gray-900">{h.organization as string}</p>
                        <p className="text-xs text-gray-500">
                          {h.role as string}
                          {h.startDate ? ` · ${formatDate(h.startDate as string)}` : ''}
                          {h.endDate ? ` – ${h.current ? 'Present' : formatDate(h.endDate as string)}` : h.current ? ' – Present' : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {education.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Education</h2>
                <div className="space-y-3">
                  {education.map((e, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-lg">
                      <p className="font-medium text-sm text-gray-900">{e.institution as string}</p>
                      <p className="text-xs text-gray-500">
                        {e.degree as string}{e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''}
                        {e.from ? ` · ${e.from}` : ''}{e.to ? ` – ${e.to}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Media */}
            {media.length > 0 && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Media</h2>
                <div className="grid grid-cols-2 gap-3">
                  {media.map((m, i) => (
                    <a key={i} href={m.url as string} target="_blank" rel="noopener noreferrer" className="group block">
                      {m.type === 'image' ? (
                        <img src={m.url as string} alt={m.caption as string || ''} className="w-full h-32 object-cover rounded-lg group-hover:opacity-90 transition-opacity" />
                      ) : (
                        <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm text-brand">▶ Video</span>
                        </div>
                      )}
                      {m.caption && <p className="text-xs text-gray-500 mt-1 truncate">{m.caption as string}</p>}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
