'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { listingAPI } from '@/lib/api';
import { ChevronLeft, Plus, Trash2, Loader2, Trophy } from 'lucide-react';
import toast from 'react-hot-toast';

const SPORTS = [
  'Cricket', 'Football', 'Basketball', 'Kabaddi', 'Athletics', 'Tennis', 'Badminton',
  'Hockey', 'Wrestling', 'Boxing', 'Volleyball', 'Swimming', 'Cycling', 'Archery',
  'Shooting', 'Weightlifting', 'Gymnastics', 'Judo', 'Table Tennis', 'Kho Kho',
  'Squash', 'Golf', 'Rugby', 'Taekwondo', 'Karate', 'MMA', 'Futsal',
  'Beach Volleyball', 'Marathon', 'CrossFit', 'Powerlifting', 'Other',
];

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Lakshadweep', 'Puducherry',
];

const TODAY = new Date().toISOString().split('T')[0];

const LISTING_TYPES = [
  { value: 'trial', label: 'Trial', desc: 'Conduct trials to select players' },
  { value: 'tournament', label: 'Tournament', desc: 'Organize a competitive event' },
  { value: 'training_camp', label: 'Training Camp', desc: 'Host a training program' },
  { value: 'admission', label: 'Admission', desc: 'Open admissions to your academy' },
  { value: 'event', label: 'Open Event', desc: 'Community sporting event' },
];

interface CustomQuestion { id: string; question: string; type: 'text' | 'yes_no' | 'multiple_choice'; required: boolean; options?: string[] }

export default function CreateListingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    type: '', title: '', description: '', sports: [] as string[],
    startDate: '', endDate: '', registrationDeadline: '',
    location: { city: '', state: '', country: 'India', isOnline: false },
    participantLimit: '', participantFee: '0',
    eligibility: { ageMin: '', ageMax: '', gender: '', experienceLevel: '', states: [] as string[] },
    contactInfo: '', contactPhone: '', banner: '',
  });
  const [questions, setQuestions] = useState<CustomQuestion[]>([]);

  const toggleSport = (s: string) => {
    setForm({ ...form, sports: form.sports.includes(s) ? form.sports.filter((x) => x !== s) : [...form.sports, s] });
  };

  const addQuestion = () => {
    setQuestions([...questions, { id: Date.now().toString(), question: '', type: 'text', required: false }]);
  };

  const handleCreate = async () => {
    if (!form.type || !form.title || !form.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await listingAPI.createListing({
        ...form,
        participantLimit: form.participantLimit ? parseInt(form.participantLimit) : undefined,
        participantFee: parseFloat(form.participantFee) || 0,
        eligibility: { ...form.eligibility, ageMin: form.eligibility.ageMin ? parseInt(form.eligibility.ageMin) : undefined, ageMax: form.eligibility.ageMax ? parseInt(form.eligibility.ageMax) : undefined },
        customQuestions: questions,
      });
      const listingId = res.data.data?._id || res.data.data?.listing?._id;
      toast.success('Listing published! It is now visible to all users.');
      router.push(`/listings/${listingId}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to create listing';
      toast.error(msg);
    }
    setIsSubmitting(false);
  };

  return (
    <AuthGuard allowedRoles={['organization']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Create New Listing</h1>
              <p className="text-sm text-gray-500">Post a trial, tournament, or event for ₹50</p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {['Listing Type', 'Details', 'Eligibility', 'Questions'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white transition-colors ${step > i + 1 ? 'bg-green-500' : step === i + 1 ? 'bg-brand' : 'bg-gray-300'}`}>
                  {step > i + 1 ? '✓' : i + 1}
                </div>
                <span className={`text-xs font-medium hidden sm:block ${step === i + 1 ? 'text-brand' : 'text-gray-400'}`}>{s}</span>
                {i < 3 && <div className={`flex-1 h-0.5 w-8 ${step > i + 1 ? 'bg-green-400' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Type */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 mb-4">What type of listing are you creating?</h2>
              <div className="space-y-3">
                {LISTING_TYPES.map(({ value, label, desc }) => (
                  <button key={value} type="button" onClick={() => setForm({ ...form, type: value })}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${form.type === value ? 'border-brand bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                    <Trophy className={`w-6 h-6 flex-shrink-0 ${form.type === value ? 'text-brand' : 'text-gray-400'}`} />
                    <div>
                      <p className="font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button disabled={!form.type} onClick={() => setStep(2)} className="btn-primary disabled:opacity-50">Next →</button>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Listing Details</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder={`e.g. Under-17 Cricket Trials 2026`} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-red-500">*</span></label>
                  <textarea rows={5} className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the event, what participants should expect, schedule..." />
                </div>
                <div className="grid sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                    <input type="date" min={TODAY} className="input-field" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input type="date" min={form.startDate || TODAY} className="input-field" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Registration Deadline</label>
                    <input type="date" min={TODAY} max={form.startDate || undefined} className="input-field" value={form.registrationDeadline} onChange={(e) => setForm({ ...form, registrationDeadline: e.target.value })} />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input className="input-field" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <select className="input-field" value={form.location.state} onChange={(e) => setForm({ ...form, location: { ...form.location, state: e.target.value } })}>
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
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
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Info / Email</label>
                    <input className="input-field" value={form.contactInfo} onChange={(e) => setForm({ ...form, contactInfo: e.target.value })} placeholder="Email or other contact info" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone (for this event)</label>
                    <input type="tel" className="input-field" value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="+91 XXXXX XXXXX (can differ from org number)" />
                  </div>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banner Image URL (optional)</label>
                  <input className="input-field" value={form.banner} onChange={(e) => setForm({ ...form, banner: e.target.value })} placeholder="https://..." />
                </div>
              </div>
              <div className="flex gap-3 justify-between">
                <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                <button disabled={!form.title || !form.description.trim() || !form.startDate} onClick={() => setStep(3)} className="btn-primary disabled:opacity-50">Next: Eligibility →</button>
              </div>
            </div>
          )}

          {/* Step 3: Eligibility */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="card p-6 space-y-4">
                <h2 className="font-semibold text-gray-900">Eligibility Criteria</h2>
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
              <div className="flex gap-3 justify-between">
                <button onClick={() => setStep(2)} className="btn-secondary">← Back</button>
                <button onClick={() => setStep(4)} className="btn-primary">Next: Questions →</button>
              </div>
            </div>
          )}

          {/* Step 4: Custom Questions */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900">Custom Questions</h2>
                    <p className="text-sm text-gray-500">Ask applicants specific questions (optional)</p>
                  </div>
                  <button onClick={addQuestion} className="flex items-center gap-1 text-sm text-brand hover:underline">
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
                        {q.type === 'multiple_choice' && (
                          <input className="input-field" placeholder="Options separated by comma (e.g. Yes, No, Maybe)"
                            value={(q.options || []).join(', ')}
                            onChange={(e) => { const c = [...questions]; c[i] = { ...q, options: e.target.value.split(',').map((o) => o.trim()) }; setQuestions(c); }} />
                        )}
                      </div>
                      <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 mt-2">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">No custom questions yet. Keep it simple or add questions to screen applicants.</p>
                )}
              </div>

              {/* Summary */}
              <div className="card p-5 bg-blue-50 border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">Listing Summary</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>📋 Type: <span className="font-medium capitalize">{form.type.replace(/_/g, ' ')}</span></p>
                  <p>🏷️ Title: <span className="font-medium">{form.title}</span></p>
                  <p>📅 Date: <span className="font-medium">{form.startDate}</span></p>
                  <p>📍 Location: <span className="font-medium">{form.location.city || 'Not set'}</span></p>
                  <p>💰 Fee: <span className="font-medium">₹{form.participantFee || '0'}</span></p>
                  <p>❓ Questions: <span className="font-medium">{questions.length}</span></p>
                </div>
                <p className="text-xs text-blue-600 mt-3 border-t border-blue-200 pt-2">
                  Your listing will be published immediately and visible to all athletes on the platform.
                </p>
              </div>

              <div className="flex gap-3 justify-between">
                <button onClick={() => setStep(3)} className="btn-secondary">← Back</button>
                <button onClick={handleCreate} disabled={isSubmitting} className="btn-primary flex items-center gap-2">
                  {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {isSubmitting ? 'Creating...' : 'Create Listing'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
