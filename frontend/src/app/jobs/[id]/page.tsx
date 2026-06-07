'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { jobAPI, profileAPI } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatCurrency, getStatusBadge } from '@/lib/utils';
import { 
  Briefcase, MapPin, Calendar, Clock, DollarSign, Building2, 
  ChevronLeft, Loader2, Send, CheckCircle, GraduationCap, 
  Award, ShieldCheck, Mail, Globe, Users, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function JobDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [coverLetter, setCoverLetter] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [isAppsLoading, setIsAppsLoading] = useState(false);

  useEffect(() => {
    const loadJob = async () => {
      setIsLoading(true);
      try {
        const res = await jobAPI.getJob(id);
        const jobData = res.data.data;
        setJob(jobData);
        
        // Ownership check
        const orgId = typeof jobData.organizationId === 'string' ? jobData.organizationId : (jobData.organizationId as Record<string, string>)?._id;
        if (isAuthenticated && user?.role === 'organization') {
          // Check if current user owns this job
          // In a real app, you'd compare org IDs
          // For now, let's assume if it's the same name or similar
          try {
             // Fetch my applications to check if applied
             const myAppsRes = await jobAPI.getMyJobApplications();
             const appliedIds = (myAppsRes.data.data || []).map((a: Record<string, unknown>) => (a.jobId as Record<string, unknown>)?._id || a.jobId);
             setHasApplied(appliedIds.includes(id));
          } catch {}
        } else if (isAuthenticated) {
           try {
             const myAppsRes = await jobAPI.getMyJobApplications();
             const appliedIds = (myAppsRes.data.data || []).map((a: Record<string, unknown>) => (a.jobId as Record<string, unknown>)?._id || a.jobId);
             setHasApplied(appliedIds.includes(id));
           } catch {}
        }
      } catch {
        toast.error('Failed to load job details');
        router.push('/jobs');
      }
      setIsLoading(false);
    };

    if (id) loadJob();
  }, [id, isAuthenticated, user, router]);

  useEffect(() => {
     if (job && user && user.role === 'organization') {
        const orgId = typeof job.organizationId === 'string' 
          ? job.organizationId 
          : (job.organizationId as Record<string, string>)?._id;
        // Check ownership by comparing the org's userId with the current user's id
        const orgUserId = typeof job.organizationId === 'string'
          ? null
          : (job.organizationId as Record<string, unknown>)?.userId;
        const orgUserIdStr = typeof orgUserId === 'string' ? orgUserId : (orgUserId as Record<string, string>)?._id;
        const owns = orgUserIdStr === user.id || orgId === user.id;
        setIsOwner(owns);
        if (owns) fetchApplications();
     }
  }, [job, user]);

  const fetchApplications = async () => {
    setIsAppsLoading(true);
    try {
      const res = await jobAPI.getJobApplications(id);
      setApplications(res.data.data || []);
    } catch {}
    setIsAppsLoading(false);
  };

  const handleApply = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to apply');
      return;
    }
    setIsApplying(true);
    try {
      await jobAPI.applyToJob(id, coverLetter);
      toast.success('Successfully applied for the job');
      setHasApplied(true);
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message || 'Failed to apply';
      toast.error(msg);
    }
    setIsApplying(false);
  };

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await jobAPI.updateApplicationStatus(id, appId, status);
      toast.success(`Application ${status}`);
      fetchApplications();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <Loader2 className="w-10 h-10 animate-spin text-brand" />
        </div>
      </div>
    );
  }

  if (!job) return null;

  const org = job.organizationId as Record<string, unknown> || {};
  const statusBadge = getStatusBadge(job.status as string);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/jobs" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand mb-6 transition-colors group">
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Jobs
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Context */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card p-8">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="badge bg-purple-100 text-purple-700 text-xs px-2.5 py-1">
                      {job.category as string}
                    </span>
                    <span className="badge bg-gray-100 text-gray-700 text-xs px-2.5 py-1 capitalize">
                      {(job.jobType as string)?.replace(/_/g, ' ')}
                    </span>
                    <span className={`badge ${statusBadge.color} text-xs px-2.5 py-1`}>
                      {statusBadge.label}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title as string}</h1>
                  <div className="flex items-center gap-2 text-brand font-medium group cursor-pointer">
                    <Building2 className="w-5 h-5 text-brand" />
                    <span>{org.name as string}</span>
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                  </div>
                </div>
                
                {isAuthenticated && user?.role !== 'organization' && (
                  <div className="shrink-0">
                    {hasApplied ? (
                      <div className="flex items-center gap-2 text-green-600 font-bold px-6 py-3 bg-green-50 rounded-xl border border-green-100">
                        <CheckCircle className="w-5 h-5" /> Applied
                      </div>
                    ) : (
                      <button 
                        onClick={() => document.getElementById('apply-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="btn-primary px-8 py-3 shadow-lg shadow-brand/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                      >
                        Apply Now
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-2xl mb-8 border border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                    <MapPin className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-semibold">{(job.location as Record<string, string>)?.isRemote ? 'Remote' : (job.location as Record<string, string>)?.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Salary</p>
                    <p className="text-sm font-semibold">{job.salaryRange ? `${formatCurrency((job.salaryRange as Record<string, number>).min)} - ${formatCurrency((job.salaryRange as Record<string, number>).max)}` : 'Competitive'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm border border-gray-100">
                    <Calendar className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Deadline</p>
                    <p className="text-sm font-semibold">{job.applicationDeadline ? formatDate(job.applicationDeadline as string, 'MMM dd, yyyy') : 'Open until filled'}</p>
                  </div>
                </div>
              </div>

              <div className="prose prose-sm prose-slate max-w-none">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Job Description</h3>
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.description as string}</p>
                
                {job.responsibilities && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Responsibilities</h3>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.responsibilities as string}</p>
                  </div>
                )}
                
                {job.requirements && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Requirements</h3>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.requirements as string}</p>
                  </div>
                )}

                {job.qualifications && (job.qualifications as string[]).length > 0 && (
                   <div className="mt-8">
                     <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                       <GraduationCap className="w-5 h-5" /> Preferred Qualifications
                     </h3>
                     <div className="flex flex-wrap gap-2">
                       {(job.qualifications as string[]).map((q, i) => (
                         <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm font-medium border border-blue-100">
                           {q}
                         </span>
                       ))}
                     </div>
                   </div>
                )}
                
                {job.benefits && (
                  <div className="mt-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Award className="w-5 h-5 text-yellow-600" /> Benefits
                    </h3>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{job.benefits as string}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Apply Section */}
            {!isOwner && isAuthenticated && user?.role !== 'organization' && !hasApplied && (
              <div id="apply-section" className="card p-8 border-2 border-brand/10 bg-gradient-to-br from-white to-blue-50/30">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Quick Apply</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Cover Letter / Note (optional)</label>
                    <textarea 
                      rows={5} 
                      className="input-field" 
                      placeholder="Explain why you are a good fit for this role..."
                      value={coverLetter}
                      onChange={(e) => setCoverLetter(e.target.value)}
                    ></textarea>
                  </div>
                  <button 
                    onClick={handleApply}
                    disabled={isApplying}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-2 font-bold text-lg"
                  >
                    {isApplying ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-5 h-5" />}
                    {isApplying ? 'Submitting...' : 'Submit Application'}
                  </button>
                  <p className="text-xs text-center text-gray-500 mt-4">
                    By applying, your profile details and career history will be shared with the recruiter.
                  </p>
                </div>
              </div>
            )}
            
            {/* Manage Section for Owner */}
            {isOwner && (
               <div className="space-y-4">
                  <div className="flex items-center justify-between">
                     <h2 className="text-2xl font-bold text-gray-900">Manage Applicants</h2>
                     <span className="badge bg-brand text-white font-bold">{applications.length}</span>
                  </div>
                  
                  {isAppsLoading ? (
                    <div className="flex items-center justify-center py-12 card"><Loader2 className="w-8 h-8 animate-spin text-brand" /></div>
                  ) : applications.length === 0 ? (
                    <div className="card p-12 text-center text-gray-500">
                      <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>No applications received yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {applications.map((app) => {
                          const applicant = app.userId as Record<string, unknown>;
                          return (
                            <div key={app._id as string} className="card p-6 flex flex-col sm:flex-row items-center gap-6">
                               <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center text-2xl font-bold text-brand uppercase">
                                  {applicant?.name ? (applicant.name as string)[0] : 'U'}
                               </div>
                               <div className="flex-1 text-center sm:text-left">
                                  <h4 className="text-lg font-bold text-gray-900">{applicant?.name as string || 'Unknown User'}</h4>
                                  <p className="text-sm text-gray-500 mb-2 capitalize">{applicant?.role as string}</p>
                                  <Link href={`/${applicant?.role}/${applicant?._id}`} className="text-brand text-xs font-bold hover:underline">View Profile →</Link>
                                  {app.coverLetter && (
                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 italic">
                                       "{app.coverLetter as string}"
                                    </div>
                                  )}
                               </div>
                               <div className="flex flex-col gap-2 shrink-0 w-full sm:w-auto">
                                  {app.status === 'applied' ? (
                                    <>
                                       <button onClick={() => handleUpdateStatus(app._id as string, 'shortlisted')} className="btn-primary py-2 px-6 text-sm">Shortlist</button>
                                       <button onClick={() => handleUpdateStatus(app._id as string, 'rejected')} className="btn-secondary py-2 px-6 text-sm text-red-600">Reject</button>
                                    </>
                                  ) : (
                                     <span className={`badge ${app.status === 'shortlisted' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-center py-2 px-4`}>
                                        {app.status as string}
                                     </span>
                                  )}
                               </div>
                            </div>
                          );
                       })}
                    </div>
                  )}
               </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
             <div className="card p-6 sticky top-24">
                <h3 className="font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100">Recruiter Details</h3>
                <div className="space-y-5">
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-brand/5 flex items-center justify-center text-brand">
                         <Building2 className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Organization</p>
                         <p className="text-sm font-bold text-gray-900 truncate">{org.name as string}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                         <Globe className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Website</p>
                         {org.website ? (
                            <a href={org.website as string} target="_blank" className="text-sm font-bold text-brand hover:underline truncate block">
                               {org.website as string}
                            </a>
                         ) : <p className="text-sm font-bold text-gray-400">Not provided</p>}
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                         <Mail className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">Contact Info</p>
                         <p className="text-sm font-bold text-gray-900 truncate">{job.contactInfo as string || 'Via platform'}</p>
                      </div>
                   </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-100">
                   <Link 
                     href={`/org/${org?._id}`} 
                     className="w-full btn-secondary py-3 flex items-center justify-center gap-2 group"
                   >
                     View Profile <ChevronLeft className="w-4 h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                   </Link>
                </div>
             </div>
             
             {/* Security Advice */}
             <div className="p-5 bg-yellow-50 rounded-2xl border border-yellow-100">
                <h4 className="text-sm font-bold text-yellow-800 flex items-center gap-2 mb-2">
                   <Clock className="w-4 h-4" /> Safety Tip
                </h4>
                <p className="text-xs text-yellow-700 leading-relaxed">
                   Never share your banking details or pay money to any recruiter on this platform. LinkSports does not charge for applications.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
