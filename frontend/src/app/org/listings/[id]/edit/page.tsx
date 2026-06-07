'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { listingAPI } from '@/lib/api';
import { ChevronLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SPORTS = ['Cricket', 'Football', 'Basketball', 'Kabaddi', 'Athletics', 'Tennis', 'Badminton', 'Hockey', 'Wrestling', 'Boxing', 'Volleyball', 'Swimming', 'Cycling', 'Archery', 'Shooting', 'Other'];

interface CustomQuestion { id: string; question: string; type: 'text' | 'yes_no' | 'multiple_choice'; required: boolean; options?: string[] }

export default function EditListingPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: '', title: '', description: '', sports: [] as string[],
    startDate: '', endDate: '', registrationDeadline: '',
    location: { city: '', state: '', country: 'India', isOnline: false },
    participantLimit: '', participantFee: '0',
    eligibility: { ageMin: '', ageMax: '', gender: '', experienceLevel: '', states: [] as string[] },
    contactInfo: '', banner: '',
  });
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const res = await listingAPI.getListing(id);
        const l = res.data.data?.listing || res.data.data;
        const toDateStr = (d: string | undefined) => d ? new Date(d).toISOString().split('T')[0] : '';
        setForm({
          type: l.type || '',
          title: l.title || '',
          description: l.description || '',
          sports: l.sports || [],
          startDate: toDateStr(l.startDate),
          endDate: toDateStr(l.endDate),
          registrationDeadline: toDateStr(l.registrationDeadline),
          location: { city: l.location?.city || '', state: l.location?.state || '', country: l.location?.country || 'India', isOnline: l.location?.isOnline || false },
          participantLimit: l.participantLimit?.toString() || '',
          participantFee: l.participantFee?.toString() || '0',
          eligibility: {
            ageMin: l.eligibility?.ageMin?.toString() || '',
            ageMax: l.eligibility?.ageMax?.toString() || '',
            gender: l.eligibility?.gender || '',
            experienceLevel: l.eligibility?.experienceLevel || '',
            states: l.eligibility?.states || [],
          },
          contactInfo: l.contactInfo || '',
          banner: l.banner || '',
        });
        setQuestions(l.customQuestions || []);
      } catch {
        toast.error('Failed to load listing');
        router.push('/org/listings');
      }
      setIsLoading(false);
    };
    fetchListing();
  }, [id]);

  const toggleSport = (s: string) => {
    setForm({ ...form, sports: form.sports.includes(s) ? form.sports.filter((x) => x !== s) : [...form.sports, s] });
  };

  const handleSave = async () => {
    if (!form.title || !form.startDate) {
      toast.error('Title and start date are required');
      return;
    }
    setIsSubmitting(true);
    try {
      await listingAPI.updateListing(id, {
        ...form,
        participantLimit: form.participantLimit ? parseInt(form.participantLimit) : undefined,
        participantFee: parseFloat(form.participantFee) || 0,
        eligibility: {
          ...form.eligibility,
          ageMin: form.eligibility.ageMin ? parseInt(form.eligibility.ageMin) : undefined,
          ageMax: form.eligibility.ageMax ? parseInt(form.eligibility.ageMax) : undefined,
        },
        customQuestions: questions,
      });
      toast.success('Listing updated successfully');
      router.push('/org/listings');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to update listing';
      toast.error(msg);
    }
    setIsSubmitting(false);
  };

  if (isLoading) {
    return (
      <AuthGuard allowedRoles={['organization']}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-brand" />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard allowedRoles={['organization']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/org/listings" className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Edit Listing</h1>
              <p className="text-sm text-gray-500">Changes go live immediately</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Details */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Basic Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Under-17 Cricket Trials 2026" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea rows={5} className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the event..." />
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                  <input type="date" className="input-field" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} />
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input className="input-field" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input className="input-field" value={form.location.state} onChange={(e) => setForm({ ...form, location: { ...form.location, state: e.target.value } })} placeholder="Maharashtra" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Participant Limit</label>
                  <input type="number" className="input-field" value={form.participantLimit} onChange={(e) => setForm({ ...form, participantLimit: e.target.value })} placeholder="Leave blank for unlimited" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Participation Fee (₹)</label>
                  <input type="number" className="input-field" value={form.participantFee} onChange={(e) => setForm({ ...form, participantFee: e.target.value })} placeholder="0 for free" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info</label>
                <input className="input-field" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} placeholder="Phone, email, or WhatsApp" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Sports</label>
                <div className="flex flex-wrap gap-2">
                  {SPORTS.map((s) => (
                    <button key={s} type="button" onClick={() => toggleSport(s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.sports.includes(s) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-300 hover:border-brand'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL</label>
                <input className="input-field" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} placeholder="https://..." />
              </div>
            </div>

            {/* Eligibility */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Eligibility</h2>
              <p className="text-sm text-gray-500">Leave blank to allow all participants</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Age</label>
                  <input type="number" className="input-field" value={form.eligibility.ageMin} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, ageMin: e.target.value } })} placeholder="e.g. 14" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Age</label>
                  <input type="number" className="input-field" value={form.eligibility.ageMax} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, ageMax: e.target.value } })} placeholder="e.g. 19" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select className="input-field" value={form.eligibility.gender} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, gender: e.target.value } })}>
                    <option value="">All Genders</option>
                    <option value="male">Male Only</option>
                    <option value="female">Female Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                  <select className="input-field" value={form.eligibility.experienceLevel} onChange={(e) => setForm({ ...form, eligibility: { ...form.eligibility, experienceLevel: e.target.value } })}>
                    <option value="">All Levels</option>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                    <option value="professional">Professional</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Questions */}
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-semibold text-gray-900">Custom Questions</h2>
                  <p className="text-sm text-gray-500">Questions shown to applicants</p>
                </div>
                <button onClick={() => setQuestions([...questions, { id: Date.now().toString(), question: '', type: 'text', required: false }])}
                  className="flex items-center gap-1 text-sm text-brand hover:underline">
                  <Plus className="w-4 h-4" /> Add Question
                </button>
              </div>
              {questions.map((q, i) => (
                <div key={q.id} className="p-4 bg-gray-50 rounded-lg mb-3">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <input className="input-field" placeholder="Question text" value={q.question}
                        onChange={(e) => { const c = [...questions]; c[i] = { ...q, question: e.target.value }; setQuestions(c); }} />
                      <div className="flex gap-3">
                        <select className="input-field" value={q.type}
                          onChange={(e) => { const c = [...questions]; c[i] = { ...q, type: e.target.value as 'text' | 'yes_no' | 'multiple_choice' }; setQuestions(c); }}>
                          <option value="text">Text Answer</option>
                          <option value="yes_no">Yes / No</option>
                          <option value="multiple_choice">Multiple Choice</option>
                        </select>
                        <label className="flex items-center gap-2 text-sm text-gray-600 whitespace-nowrap cursor-pointer">
                          <input type="checkbox" checked={q.required} onChange={(e) => { const c = [...questions]; c[i] = { ...q, required: e.target.checked }; setQuestions(c); }} />
                          Required
                        </label>
                      </div>
                    </div>
                    <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 mt-2">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {questions.length === 0 && <p className="text-sm text-gray-400 text-center py-4">No custom questions.</p>}
            </div>

            <div className="flex gap-3 justify-between">
              <Link href="/org/listings" className="btn-secondary">Cancel</Link>
              <button onClick={handleSave} disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
