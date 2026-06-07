'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { profileAPI, connectionAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { getInitials, formatDate, getPhotoUrl } from '@/lib/utils';
import { MapPin, UserPlus, CheckCircle, MessageCircle, ChevronLeft, Award, Briefcase, Loader2, Edit, Download, Share2 } from 'lucide-react';
import toast from 'react-hot-toast';

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

  useEffect(() => { fetchProfile(); }, [id]);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await profileAPI.getCoachProfile(id);
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
                    <span className="text-gray-500">Availability</span>
                    <span className="font-medium text-gray-900 capitalize">{(profile.availability as string).replace(/_/g, ' ')}</span>
                  </div>
                )}
                {profile.email && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium text-gray-900">{profile.email as string}</span>
                  </div>
                )}
                {profile.phone && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mobile</span>
                    <span className="font-medium text-gray-900">{profile.phone as string}</span>
                  </div>
                )}
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
                <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-brand" /> Qualifications</h2>
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
          </div>
        </div>
      </div>
    </div>
  );
}
