'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import AuthGuard from '@/components/shared/AuthGuard';
import { listingAPI } from '@/lib/api';
import { formatDate, getStatusBadge } from '@/lib/utils';
import { 
  Users, Trophy, ChevronLeft, Loader2, Download, 
  CheckCircle, XCircle, Search, Mail, Phone, ExternalLink 
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function ListingApplicationsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [listing, setListing] = useState<Record<string, unknown> | null>(null);
  const [applications, setApplications] = useState<Record<string, unknown>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [listingRes, appsRes] = await Promise.all([
        listingAPI.getListing(id),
        listingAPI.getApplications(id)
      ]);
      setListing(listingRes.data.data?.listing || listingRes.data.data);
      setApplications(appsRes.data.data || []);
    } catch {
      toast.error('Failed to load applications');
      router.push('/org/listings');
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const handleUpdateStatus = async (appId: string, status: string) => {
    try {
      await listingAPI.updateApplicationStatus(appId, status);
      toast.success(`Applicant ${status}`);
      setApplications(prev => prev.map(a => a._id === appId ? { ...a, status } : a));
    } catch {
      toast.error('Failed to update status');
    }
  };

  const getAppUser = (app: Record<string, unknown>) => {
    const applicant = app.applicantId as Record<string, unknown>;
    const profile = app.profile as Record<string, unknown> | null;
    return {
      name: (profile?.fullName as string) || (applicant?.email as string)?.split('@')[0] || 'Unknown',
      email: applicant?.email as string,
      phone: applicant?.phone as string,
      photo: profile?.photo as string,
      _id: (applicant?._id as string) || (applicant?.id as string),
      role: applicant?.role as string,
    };
  };

  const filteredApps = applications.filter(app => {
    const u = getAppUser(app);
    const matchesSearch = u.name.toLowerCase().includes(filter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const exportCSV = () => {
     const headers = ['Name', 'Email', 'Role', 'Status', 'Applied On'];
     const rows = filteredApps.map(app => {
        const u = getAppUser(app);
        return [u.name, u.email, u.role, app.status, formatDate(app.createdAt as string)];
     });
     const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].map(e => e.join(",")).join("\n");
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `applications_${id}.csv`);
     document.body.appendChild(link);
     link.click();
  };

  if (isLoading) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-brand" /></div>;

  return (
    <AuthGuard allowedRoles={['organization']}>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/org/listings" className="text-gray-500 hover:text-gray-700">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Applicants: {listing?.title as string}</h1>
              <p className="text-sm text-gray-500">{applications.length} total applications</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-4 gap-6">
            {/* Stats Sidebar */}
            <div className="lg:col-span-1 space-y-4">
               <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                     <Trophy className="w-4 h-4 text-brand" /> Listing Info
                  </h3>
                  <div className="space-y-3 text-sm">
                     <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="badge bg-green-100 text-green-700 uppercase leading-none">{listing?.status as string}</span></div>
                     <div className="flex justify-between"><span className="text-gray-500">Start Date</span><span className="font-medium">{formatDate(listing?.startDate as string)}</span></div>
                     <div className="flex justify-between"><span className="text-gray-500">Spots</span><span className="font-medium">{listing?.participantCount as number} / {listing?.participantLimit as number || '∞'}</span></div>
                  </div>
                  <Link href={`/listings/${id}`} className="w-full btn-secondary mt-6 py-2 text-sm text-center block">View Original Listing</Link>
               </div>

               <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-4">Summary</h3>
                  <div className="space-y-2">
                     <div className="flex justify-between text-sm"><span className="text-gray-500">Shortlisted</span><span className="font-bold text-green-600">{applications.filter(a => a.status === 'shortlisted').length}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-gray-500">Rejected</span><span className="font-bold text-red-600">{applications.filter(a => a.status === 'rejected').length}</span></div>
                     <div className="flex justify-between text-sm"><span className="text-gray-500">Pending</span><span className="font-bold text-blue-600">{applications.filter(a => a.status === 'applied').length}</span></div>
                  </div>
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
                  <button onClick={exportCSV} className="btn-secondary flex items-center gap-2 py-2 px-4 whitespace-nowrap">
                     <Download className="w-4 h-4" /> Export CSV
                  </button>
               </div>

               {filteredApps.length === 0 ? (
                  <div className="card p-12 text-center text-gray-500">
                     <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                     <p>No applicants found matching your filters.</p>
                  </div>
               ) : (
                  <div className="space-y-3">
                     {filteredApps.map((app) => {
                        const u = getAppUser(app);
                        const answers = (app.answers as Record<string, unknown>[]) || [];
                        return (
                           <div key={app._id as string} className="card overflow-hidden">
                              <div className="p-6 flex flex-col md:flex-row gap-6">
                                 <div className="w-20 h-20 rounded-2xl bg-brand/10 text-brand flex items-center justify-center text-2xl font-bold flex-shrink-0 overflow-hidden">
                                    {u.photo
                                      ? <img src={u.photo} alt="" className="w-full h-full object-cover" />
                                      : (u.name[0]?.toUpperCase() || '?')}
                                 </div>
                                 <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                                       <div>
                                          <h4 className="text-xl font-bold text-gray-900">{u.name}</h4>
                                          <p className="text-sm text-brand font-medium capitalize">{u.role || 'Athlete'} Profile</p>
                                       </div>
                                       <span className={`badge ${getStatusBadge(app.status as string).color} text-xs px-3 py-1`}>
                                          {getStatusBadge(app.status as string).label}
                                       </span>
                                    </div>
                                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                                       {u.email && <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {u.email}</span>}
                                       {u.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {u.phone}</span>}
                                       <span className="flex items-center gap-1">📅 Applied: {formatDate(app.createdAt as string)}</span>
                                    </div>
                                    
                                    {answers.length > 0 && (
                                       <div className="bg-gray-50 p-4 rounded-xl space-y-3 mb-4">
                                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Application Answers</p>
                                          {answers.map((ans, i) => (
                                             <div key={i}>
                                                <p className="text-sm font-semibold text-gray-700">{ans.question as string}</p>
                                                <p className="text-sm text-gray-600">{ans.answer as string}</p>
                                             </div>
                                          ))}
                                       </div>
                                    )}

                                    <div className="flex flex-wrap items-center gap-2">
                                       <Link href={`/athlete/${u._id}`} className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5">
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
