'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { jobAPI } from '@/lib/api';
import { formatDate, getStatusBadge } from '@/lib/utils';
import { 
  Users, Briefcase, ChevronLeft, Loader2, Download, 
  CheckCircle, XCircle, Search, Mail, Phone, ExternalLink, FileText
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function JobApplicationsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [job, setJob] = useState<Record<string, unknown> | null>(null);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [jobRes, appsRes] = await Promise.all([
        jobAPI.getJob(id),
        jobAPI.getJobApplications(id)
      ]);
      setJob(jobRes.data.data);
      setApplications(appsRes.data.data || []);
    } catch {
      toast.error('Failed to load job applications');
      router.push('/org/jobs');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await jobAPI.updateApplicationStatus(id, appId, status);
      toast.success(`Applicant ${status}`);
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filteredApps = applications.filter(app => {
    const user = app.userId as Record<string, unknown>;
    const matchesSearch = user?.name ? (user.name as string).toLowerCase().includes(filter.toLowerCase()) : true;
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>;

  return (
    <AuthGuard allowedRoles={['organization']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/org/jobs" className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Applicants: {job?.title as string}</h1>
              <p className="text-sm text-gray-500">{applications.length} total applicants</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Stats Sidebar */}
            <div className="lg:col-span-1 space-y-4">
               <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <Briefcase className="w-4 h-4 text-brand" /> Job Details
                  </h3>
                  <div className="space-y-3 text-sm">
                     <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="badge bg-green-100 text-green-700 uppercase leading-none">{job?.status as string}</span></div>
                     <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="font-medium">{job?.category as string}</span></div>
                     <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-medium capitalize">{((job?.jobType as string) || '').replace(/_/g, ' ')}</span></div>
                  </div>
                  <Link href={`/jobs/${id}`} className="w-full btn-secondary mt-6 py-2 text-sm text-center block">View Posting</Link>
               </div>
            </div>

            {/* Application List */}
            <div className="lg:col-span-3 space-y-4">
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex flex-1 gap-2">
                     <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input 
                           type="text" 
                           placeholder="Search by name..." 
                           className="input-field pl-10"
                           value={filter}
                           onChange={(e) => setFilter(e.target.value)}
                        />
                     </div>
                     <select 
                        className="input-field w-auto"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                     >
                        <option value="all">All Status</option>
                        <option value="applied">New</option>
                        <option value="shortlisted">Shortlisted</option>
                        <option value="rejected">Rejected</option>
                     </select>
                  </div>
               </div>

               {filteredApps.length === 0 ? (
                  <div className="card p-12 text-center text-gray-500">
                     <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                     <p>No job applicants found.</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {filteredApps.map((app) => {
                        const user = app.userId as Record<string, unknown>;
                        return (
                           <div key={app._id as string} className="card overflow-hidden">
                              <div className="p-6 flex flex-col md:flex-row gap-6">
                                 <div className="w-20 h-20 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-2xl font-bold flex-shrink-0">
                                    {user?.name ? (user.name as string)[0] : '?'}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                                       <div>
                                          <h4 className="text-xl font-bold text-gray-900">{user?.name as string || 'Unknown Applicant'}</h4>
                                          <p className="text-sm text-brand font-medium capitalize">{user?.role as string}</p>
                                       </div>
                                       <span className={`badge ${getStatusBadge(app.status as string).color} text-xs px-3 py-1`}>
                                          {getStatusBadge(app.status as string).label}
                                       </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                       <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user?.email as string}</span>
                                       {user?.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {user.phone as string}</span>}
                                       <span className="flex items-center gap-1">📅 Applied: {formatDate(app.createdAt as string)}</span>
                                    </div>
                                    
                                    {app.coverLetter && (
                                       <div className="bg-gray-50 p-4 rounded-xl mb-4 border-l-4 border-brand">
                                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                                             <FileText className="w-3 h-3" /> Cover Letter / Note
                                          </p>
                                          <p className="text-sm text-gray-600 italic whitespace-pre-wrap leading-relaxed">
                                             "{app.coverLetter as string}"
                                          </p>
                                       </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2">
                                       <Link href={`/${user.role}/${user?._id}`} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
                                          <ExternalLink className="w-3.5 h-3.5" /> View Profile
                                       </Link>
                                       {app.status === 'applied' ? (
                                          <>
                                             <button 
                                                onClick={() => handleUpdateStatus(app._id as string, 'shortlisted')}
                                                className="btn-primary text-xs px-3 py-1.5 bg-green-600 hover:bg-green-700 border-none"
                                             >
                                                Shortlist
                                             </button>
                                             <button 
                                                onClick={() => handleUpdateStatus(app._id as string, 'rejected')}
                                                className="btn-secondary text-xs px-3 py-1.5 text-red-600 hover:bg-red-50"
                                             >
                                                Reject
                                             </button>
                                          </>
                                       ) : (
                                          <button 
                                             onClick={() => handleUpdateStatus(app._id as string, 'applied')}
                                             className="text-xs text-gray-500 hover:underline"
                                          >
                                             Revert to Pending
                                          </button>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                     })}
                  </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
