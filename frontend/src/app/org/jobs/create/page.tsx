'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { jobAPI } from '@/lib/api';
import { ChevronLeft, Briefcase, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SPORTS = ['Cricket', 'Football', 'Basketball', 'Kabaddi', 'Athletics', 'Tennis', 'Badminton', 'Hockey', 'Wrestling', 'Boxing', 'Volleyball', 'Swimming', 'Cycling', 'Archery', 'Shooting', 'Other'];

const JOB_CATEGORIES = [
  'Head Coach', 'Assistant Coach', 'Fitness Trainer', 'Physiotherapist', 'Nutritionist',
  'Sports Psychologist', 'PE Teacher', 'Team Manager', 'Scout', 'Sports Analyst',
  'Sports Administrator', 'Event Coordinator', 'Sports Journalist', 'Other',
];

export default function CreateJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: '', jobType: 'full_time',
    sports: [] as string[], experienceRequired: '',
    location: { city: '', state: '', country: 'India', isRemote: false },
    salaryMin: '', salaryMax: '', salaryType: 'monthly',
    applicationDeadline: '', requirements: '', responsibilities: '',
    benefits: '',
    qualifications: [] as string[],
  });
  const [qualInput, setQualInput] = useState('');

  const toggleSport = (s: string) => {
    setForm({ ...form, sports: form.sports.includes(s) ? form.sports.filter((x) => x !== s) : [...form.sports, s] });
  };

  const addQualification = () => {
    if (qualInput.trim()) {
      setForm({ ...form, qualifications: [...form.qualifications, qualInput.trim()] });
      setQualInput('');
    }
  };

  const handleCreate = async () => {
    if (!form.title || !form.category || !form.description) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        ...form,
        salaryRange: form.salaryMin
          ? { min: parseInt(form.salaryMin), max: parseInt(form.salaryMax) || undefined, type: form.salaryType }
          : undefined,
        experienceRequired: form.experienceRequired ? parseInt(form.experienceRequired) : undefined,
      };
      const res = await jobAPI.createJob(payload);
      const jobId = res.data.data?._id || res.data.data?.job?._id;
      toast.success('Job posted! Submit for review to publish.');
      router.push(`/jobs/${jobId}`);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to create job';
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
              <h1 className="text-2xl font-bold text-gray-900">Post a Job Opening</h1>
              <p className="text-sm text-gray-500">Find the right coaching or sports professional talent</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-brand" /> Job Details
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                  <input className="input-field" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Head Cricket Coach" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <select className="input-field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="">Select category</option>
                    {JOB_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Type</label>
                  <select className="input-field" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="internship">Internship</option>
                    <option value="volunteer">Volunteer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Experience Required (years)</label>
                  <input type="number" className="input-field" value={form.experienceRequired} onChange={(e) => setForm({ ...form, experienceRequired: e.target.value })} placeholder="e.g. 3" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input type="date" className="input-field" value={form.applicationDeadline} onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Description *</label>
                <textarea rows={5} className="input-field" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe the role, responsibilities, and what you're looking for..." />
              </div>
            </div>

            {/* Location */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Location</h2>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.location.isRemote} onChange={(e) => setForm({ ...form, location: { ...form.location, isRemote: e.target.checked } })} />
                <span className="text-sm font-medium text-gray-700">This is a remote position</span>
              </label>
              {!form.location.isRemote && (
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input className="input-field" value={form.location.city} onChange={(e) => setForm({ ...form, location: { ...form.location, city: e.target.value } })} placeholder="Mumbai" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input className="input-field" value={form.location.state} onChange={(e) => setForm({ ...form, location: { ...form.location, state: e.target.value } })} placeholder="Maharashtra" />
                  </div>
                </div>
              )}
            </div>

            {/* Salary */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Compensation</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Salary (₹)</label>
                  <input type="number" className="input-field" value={form.salaryMin} onChange={(e) => setForm({ ...form, salaryMin: e.target.value })} placeholder="20000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Salary (₹)</label>
                  <input type="number" className="input-field" value={form.salaryMax} onChange={(e) => setForm({ ...form, salaryMax: e.target.value })} placeholder="40000" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select className="input-field" value={form.salaryType} onChange={(e) => setForm({ ...form, salaryType: e.target.value })}>
                    <option value="monthly">Monthly</option>
                    <option value="annual">Annual</option>
                    <option value="hourly">Hourly</option>
                    <option value="per_session">Per Session</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sports */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Sports</h2>
              <div className="flex flex-wrap gap-2">
                {SPORTS.map((s) => (
                  <button key={s} type="button" onClick={() => toggleSport(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${form.sports.includes(s) ? 'bg-brand text-white border-brand' : 'bg-white text-gray-600 border-gray-300 hover:border-brand'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="card p-6 space-y-4">
              <h2 className="font-semibold text-gray-900">Requirements & Benefits</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea rows={3} className="input-field" value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} placeholder="What qualifications or experience do you require?" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsibilities</label>
                <textarea rows={3} className="input-field" value={form.responsibilities} onChange={(e) => setForm({ ...form, responsibilities: e.target.value })} placeholder="Key responsibilities for this role..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Benefits</label>
                <textarea rows={2} className="input-field" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} placeholder="Accommodation, transport, bonuses, etc." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualifications / Certifications</label>
                <div className="flex gap-2 mb-2">
                  <input className="input-field" value={qualInput} onChange={(e) => setQualInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQualification(); } }}
                    placeholder="e.g. SAI Level 1 Certificate, B.P.Ed" />
                  <button type="button" onClick={addQualification} className="btn-secondary whitespace-nowrap text-sm">Add</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.qualifications.map((q, i) => (
                    <span key={i} className="badge bg-gray-100 text-gray-700 flex items-center gap-1">
                      {q}
                      <button onClick={() => setForm({ ...form, qualifications: form.qualifications.filter((_, j) => j !== i) })} className="ml-1 text-gray-400 hover:text-red-500">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button onClick={handleCreate} disabled={isSubmitting} className="btn-primary flex items-center gap-2 px-8 py-3">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Briefcase className="w-4 h-4" />}
                {isSubmitting ? 'Posting...' : 'Post Job Opening'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
