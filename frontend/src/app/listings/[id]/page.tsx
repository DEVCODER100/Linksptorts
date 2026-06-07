'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { listingAPI, paymentAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency, getListingTypeBadge, getStatusBadge } from '@/lib/utils';
import { MapPin, Calendar, Users, ChevronLeft, ExternalLink, CheckCircle, AlertCircle, Loader2, Trophy, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ListingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [listing, setListing] = useState<Record<string, unknown> | null>(null);
  const [userApplication, setUserApplication] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);

  useEffect(() => {
    fetchListing();
  }, [id]);

  const fetchListing = async () => {
    try {
      const res = await listingAPI.getListing(id);
      setListing(res.data.data?.listing || res.data.data);
      setUserApplication(res.data.data?.userApplication || null);
    } catch { toast.error('Listing not found'); router.push('/listings'); }
    setIsLoading(false);
  };

  const handleApply = async () => {
    if (!isAuthenticated) { router.push('/auth/login?redirect=/listings/' + id); return; }

    const fee = (listing?.participantFee as number) || 0;
    if (fee > 0) {
      try {
        setIsApplying(true);
        const orderRes = await paymentAPI.createOrder({
          type: 'participant_fee',
          referenceId: listing?._id,
          referenceType: 'Listing',
          couponCode: couponCode || undefined,
        });
        const { orderId, amount, key, isFree } = orderRes.data.data;

        if (isFree) {
          await listingAPI.applyToListing(id, { answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })) });
          toast.success('Application submitted!');
          fetchListing();
          setShowApplyForm(false);
          return;
        }

        // Load Razorpay
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        document.body.appendChild(script);
        script.onload = () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const RazorpayConstructor = (window as any).Razorpay as new (options: Record<string, unknown>) => { open(): void };
          const rzp = new RazorpayConstructor({
            key, amount, currency: 'INR',
            name: 'LinkSports', description: `Application: ${listing?.title}`,
            order_id: orderId,
            handler: async (response: Record<string, string>) => {
              await paymentAPI.verifyPayment({ ...response, paymentId: orderRes.data.data.payment._id });
              await listingAPI.applyToListing(id, { answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })) });
              toast.success('Payment successful! Application submitted.');
              fetchListing();
              setShowApplyForm(false);
            },
          });
          rzp.open();
        };
      } catch { toast.error('Failed to initiate payment'); }
      finally { setIsApplying(false); }
      return;
    }

    setIsApplying(true);
    try {
      await listingAPI.applyToListing(id, { answers: Object.entries(answers).map(([questionId, answer]) => ({ questionId, answer })) });
      toast.success('Application submitted!');
      fetchListing();
      setShowApplyForm(false);
    } catch (error: unknown) {
      const msg = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Application failed';
      toast.error(msg);
    } finally { setIsApplying(false); }
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>;
  if (!listing) return null;

  const type = getListingTypeBadge(listing.type as string);
  const status = getStatusBadge(listing.status as string);
  const org = listing.organizationId as Record<string, unknown>;
  const loc = listing.location as Record<string, string>;
  const eligibility = listing.eligibility as Record<string, unknown>;
  const questions = (listing.customQuestions as Record<string, unknown>[]) || [];
  const fee = (listing.participantFee as number) || 0;
  const isDeadlinePassed = listing.registrationDeadline && new Date(listing.registrationDeadline as string) < new Date();
  const isFull = listing.participantLimit && (listing.participantCount as number) >= (listing.participantLimit as number);
  const canApply = listing.status === 'published' && !isDeadlinePassed && !isFull && !userApplication;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/listings" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ChevronLeft className="w-4 h-4" /> Back to listings
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-4">
            {listing.banner && (
              <img
                src={listing.banner as string}
                alt={listing.title as string}
                className="w-full h-48 object-cover rounded-xl"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
              />
            )}

            <div className="card p-6">
              <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`badge ${type.color}`}>{type.label}</span>
                    {isDeadlinePassed ? (
                      <span className="badge bg-gray-100 text-gray-500">Closed</span>
                    ) : (
                      <span className={`badge ${status.color}`}>{status.label}</span>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{listing.title as string}</h1>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 mb-6">
                {loc?.city && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="w-4 h-4 text-brand flex-shrink-0" />
                    {loc.city}{loc.state ? `, ${loc.state}` : ''}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-brand flex-shrink-0" />
                  {formatDate(listing.startDate as string)}
                  {listing.endDate && ` - ${formatDate(listing.endDate as string)}`}
                </div>
                {listing.registrationDeadline && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4 text-brand flex-shrink-0" />
                    Deadline: {formatDate(listing.registrationDeadline as string)}
                  </div>
                )}
                {listing.participantLimit && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Users className="w-4 h-4 text-brand flex-shrink-0" />
                    {listing.participantCount as number}/{listing.participantLimit as number} applicants
                  </div>
                )}
              </div>

              <div className="prose prose-sm max-w-none text-gray-600 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">About this {listing.type as string}</h3>
                <p className="whitespace-pre-wrap">{listing.description as string}</p>
              </div>

              {eligibility && Object.keys(eligibility).some((k) => eligibility[k]) && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Eligibility Criteria</h3>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {eligibility.ageMin && <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">Age: {eligibility.ageMin as string} - {eligibility.ageMax as string} years</div>}
                    {eligibility.gender && <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">Gender: {eligibility.gender as string}</div>}
                    {eligibility.experienceLevel && <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">Level: {eligibility.experienceLevel as string}</div>}
                    {(eligibility.paraClassifications as string[])?.length > 0 && <div className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">Para Classes: {(eligibility.paraClassifications as string[]).join(', ')}</div>}
                  </div>
                </div>
              )}

              {listing.contactInfo && (
                <div className="pt-4 border-t border-gray-100">
                  <h3 className="font-semibold text-gray-900 mb-1">Contact</h3>
                  {isAuthenticated ? (
                    <p className="text-sm text-gray-600">{listing.contactInfo as string}</p>
                  ) : (
                    <p className="text-sm text-gray-400 italic">
                      <Link href={`/auth/login?redirect=/listings/${id}`} className="text-brand hover:underline font-medium">Sign in</Link> to view contact details
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Apply Form */}
            {showApplyForm && (
              <div className="card p-6">
                <h3 className="font-semibold text-gray-900 mb-4">Complete your application</h3>
                {questions.map((q) => (
                  <div key={q.id as string} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">{q.question as string} {q.required && <span className="text-red-500">*</span>}</label>
                    {q.type === 'yes_no' ? (
                      <select className="input-field" onChange={(e) => setAnswers({ ...answers, [q.id as string]: e.target.value })}>
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    ) : q.type === 'multiple_choice' ? (
                      <select className="input-field" onChange={(e) => setAnswers({ ...answers, [q.id as string]: e.target.value })}>
                        <option value="">Select an option</option>
                        {(q.options as string[])?.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <textarea className="input-field" rows={3} onChange={(e) => setAnswers({ ...answers, [q.id as string]: e.target.value })} placeholder="Your answer..." />
                    )}
                  </div>
                ))}
                {fee > 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm font-medium text-yellow-800">Participation fee: {formatCurrency(fee)}</p>
                    <div className="flex gap-2 mt-2">
                      <input type="text" placeholder="Coupon code" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="input-field text-sm" />
                    </div>
                  </div>
                )}
                <div className="flex gap-3">
                  <button onClick={handleApply} disabled={isApplying} className="btn-primary flex items-center gap-2">
                    {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {fee > 0 ? `Pay & Apply (${formatCurrency(fee - couponDiscount)})` : 'Submit Application'}
                  </button>
                  <button onClick={() => setShowApplyForm(false)} className="btn-secondary">Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Organization card */}
            <div className="card p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Organized by</h3>
              {org?._id ? (
                <Link href={`/org/${(org.profileUrl as string) || (org._id as string)}`} className="flex items-center gap-3 hover:opacity-80">
                  <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-sm overflow-hidden flex-shrink-0">
                    {(org.logo as string) ? (
                      <img src={org.logo as string} alt={org.name as string} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                    ) : (
                      (org?.name as string)?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{(org?.name as string) || 'Unknown Organisation'}</p>
                    <div className="flex items-center gap-1">
                      {org?.isVerified && <CheckCircle className="w-3 h-3 text-green-500" />}
                      <span className="text-xs text-gray-500 capitalize">{(org?.type as string) || 'Organisation'}</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <p className="text-sm text-gray-400 italic">Organisation info unavailable</p>
              )}
            </div>

            {/* Apply action */}
            <div className="card p-4">
              <div className="text-center mb-4">
                {fee > 0 ? (
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(fee)}</p>
                ) : (
                  <p className="text-lg font-semibold text-green-600">Free to Apply</p>
                )}
              </div>

              {userApplication ? (
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 p-3 rounded-lg ${getStatusBadge(userApplication.status as string).color} bg-opacity-10`}>
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Applied — {getStatusBadge(userApplication.status as string).label}</span>
                  </div>
                </div>
              ) : isDeadlinePassed ? (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  Registration deadline passed
                </div>
              ) : isFull ? (
                <div className="flex items-center gap-2 p-3 bg-orange-50 text-orange-700 rounded-lg text-sm">
                  <Users className="w-4 h-4" />
                  Spots full
                </div>
              ) : listing.status !== 'published' ? (
                <div className="flex items-center gap-2 p-3 bg-gray-100 text-gray-600 rounded-lg text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {getStatusBadge(listing.status as string).label}
                </div>
              ) : (
                <button
                  onClick={() => { if (!isAuthenticated) { router.push('/auth/login'); return; } setShowApplyForm(true); window.scrollTo({ top: 9999, behavior: 'smooth' }); }}
                  className="btn-primary w-full py-3 text-center"
                >
                  {user?.role === 'organization' ? 'Organizations cannot apply' : 'Apply Now'}
                </button>
              )}
            </div>

            {/* Quick info */}
            <div className="card p-4 space-y-3">
              <h3 className="font-semibold text-gray-900">Details</h3>
              {(listing.sports as string[])?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {(listing.sports as string[]).map((s) => <span key={s} className="badge bg-blue-50 text-blue-700">{s}</span>)}
                </div>
              )}
              {listing.registrationDeadline && (
                <div className="text-xs text-gray-500">Deadline: <span className="font-medium text-gray-700">{formatDate(listing.registrationDeadline as string)}</span></div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
