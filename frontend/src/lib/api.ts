import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle token refresh with mutex to prevent race conditions
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token!);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (typeof error.config & { _retry?: boolean });

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Only attempt refresh if the user was previously authenticated.
      // Unauthenticated visitors browsing public pages should not trigger session-expired.
      const hadToken = typeof window !== 'undefined' && !!localStorage.getItem('accessToken');
      if (!hadToken) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Queue this request until the ongoing refresh completes
        return new Promise<string>((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Send the stored refresh token in the body. This makes refresh work even when
        // the httpOnly cookie is blocked (cross-domain frontend/backend → third-party cookie).
        const storedRefresh = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        const response = await axios.post(
          `${API_URL}/auth/refresh`,
          storedRefresh ? { refreshToken: storedRefresh } : {},
          { withCredentials: true }
        );
        const { accessToken, refreshToken: rotatedRefresh } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        // Persist the rotated refresh token so the chain keeps working.
        if (rotatedRefresh) localStorage.setItem('refreshToken', rotatedRefresh);
        if (originalRequest.headers) originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        processQueue(null, accessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'));
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  register: (data: Record<string, unknown>) => api.post('/auth/register', data),
  login: (data: { email: string; password: string }) => api.post('/auth/login', data),
  sendPhoneOtp: (phone: string) => api.post('/auth/phone/send-otp', { phone }),
  loginWithPhone: (data: { phone: string; otp: string }) => api.post('/auth/phone/login', data),
  logout: () => api.post('/auth/logout'),
  verifyEmail: (data: { email: string; otp: string }) => api.post('/auth/verify-email', data),
  resendOtp: (email: string) => api.post('/auth/resend-otp', { email }),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data: Record<string, string>) => api.post('/auth/reset-password', data),
  getMe: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh'),
  updateRole: (role: string) => api.patch('/auth/update-role', { role }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => api.post('/auth/change-password', data),
  deleteAccount: () => api.delete('/auth/account'),
};

// ── Profiles ──────────────────────────────────────────────────────────────────
export const profileAPI = {
  searchProfiles: (params: Record<string, unknown>) => api.get('/profiles/search', { params }),
  getAthleteProfile: (id: string) => api.get(`/profiles/athlete/${id}`),
  getMyAthleteProfile: () => api.get('/profiles/athlete/me'),
  updateAthleteProfile: (data: Record<string, unknown>) => api.patch('/profiles/athlete', data),
  getCoachProfile: (id: string) => api.get(`/profiles/coach/${id}`),
  getMyCoachProfile: () => api.get('/profiles/coach/me'),
  updateCoachProfile: (data: Record<string, unknown>) => api.patch('/profiles/coach', data),
  getOrganizationProfile: (id: string) => api.get(`/profiles/organization/${id}`),
  getMyOrganizationProfile: () => api.get('/profiles/organization/me'),
  updateOrganizationProfile: (data: Record<string, unknown>) => api.patch('/profiles/organization', data),
  uploadVerificationDocuments: (documents: string[]) => api.post('/profiles/organization/documents', { documents }),
  downloadAthleteCV: (id: string) => api.get(`/profiles/athlete/${id}/cv`, { responseType: 'blob' }),
  downloadCoachCV: (id: string) => api.get(`/profiles/coach/${id}/cv`, { responseType: 'blob' }),
};

// ── Connections ───────────────────────────────────────────────────────────────
export const connectionAPI = {
  getConnections: (params?: Record<string, unknown>) => api.get('/connections', { params }),
  sendRequest: (recipientId: string, note?: string) => api.post('/connections/request', { recipientId, note }),
  respondToRequest: (id: string, action: 'accept' | 'reject') => api.post(`/connections/${id}/respond`, { action }),
  withdrawConnection: (id: string) => api.delete(`/connections/${id}`),
  getPendingRequests: () => api.get('/connections/pending'),
  getSentRequests: () => api.get('/connections/sent'),
  withdrawSentRequest: (id: string) => api.delete(`/connections/request/${id}`),
  followUser: (followingId: string) => api.post('/connections/follow', { followingId }),
  blockUser: (blockedId: string) => api.post('/connections/block', { blockedId }),
  getConnectionStatus: (userId: string) => api.get(`/connections/status/${userId}`),
  getConnectionStatuses: (userIds: string[]) => api.post('/connections/statuses', { userIds }),
};

// ── Reviews & Ratings ──────────────────────────────────────────────────────────
export const reviewAPI = {
  getReviews: (userId: string) => api.get(`/users/${userId}/reviews`),
  getRating: (userId: string) => api.get(`/users/${userId}/rating`),
  addReview: (userId: string, data: { rating: number; comment?: string }) => api.post(`/users/${userId}/reviews`, data),
  updateReview: (reviewId: string, data: { rating?: number; comment?: string }) => api.put(`/reviews/${reviewId}`, data),
  deleteReview: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
  reportReview: (reviewId: string, reason?: string) => api.post(`/reviews/${reviewId}/report`, { reason }),
};

// ── Listings ──────────────────────────────────────────────────────────────────
export const listingAPI = {
  getListings: (params?: Record<string, unknown>) => api.get('/listings', { params }),
  getListing: (id: string) => api.get(`/listings/${id}`),
  createListing: (data: Record<string, unknown>) => api.post('/listings', data),
  updateListing: (id: string, data: Record<string, unknown>) => api.patch(`/listings/${id}`, data),
  submitForReview: (id: string) => api.post(`/listings/${id}/submit`),
  cancelListing: (id: string, reason: string) => api.post(`/listings/${id}/cancel`, { reason }),
  applyToListing: (id: string, data: Record<string, unknown>) => api.post(`/listings/${id}/apply`, data),
  getApplications: (id: string, params?: Record<string, unknown>) => api.get(`/listings/${id}/applications`, { params }),
  updateApplicationStatus: (appId: string, status: string, reason?: string) =>
    api.patch(`/listings/applications/${appId}/status`, { status, reason }),
  getMyListings: () => api.get('/listings/my'),
  getMyApplications: () => api.get('/listings/applications/mine'),
};

// ── Jobs ──────────────────────────────────────────────────────────────────────
export const jobAPI = {
  getJobs: (params?: Record<string, unknown>) => api.get('/jobs', { params }),
  getJob: (id: string) => api.get(`/jobs/${id}`),
  createJob: (data: Record<string, unknown>) => api.post('/jobs', data),
  submitForReview: (id: string) => api.post(`/jobs/${id}/submit`),
  applyToJob: (id: string, coverLetter?: string) => api.post(`/jobs/${id}/apply`, { coverLetter }),
  getJobApplications: (id: string, params?: Record<string, unknown>) => api.get(`/jobs/${id}/applications`, { params }),
  updateApplicationStatus: (id: string, appId: string, status: string, reason?: string) =>
    api.patch(`/jobs/${id}/applications/${appId}/status`, { status, reason }),
  getMyJobApplications: () => api.get('/jobs/mine/applications'),
  getMyOrgJobs: () => api.get('/jobs/mine/listings'),
};

// ── Messages ──────────────────────────────────────────────────────────────────
export const messageAPI = {
  getConversations: () => api.get('/messages/conversations'),
  getOrCreateConversation: (userId: string) => api.get(`/messages/conversations/${userId}/with`),
  getMessages: (conversationId: string, params?: Record<string, unknown>) =>
    api.get(`/messages/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId: string, data: Record<string, unknown>) =>
    api.post(`/messages/conversations/${conversationId}/messages`, data),
  getUnreadCount: () => api.get('/messages/unread'),
};

// ── Notifications ─────────────────────────────────────────────────────────────
export const notificationAPI = {
  getNotifications: (params?: Record<string, unknown>) => api.get('/notifications', { params }),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentAPI = {
  createOrder: (data: Record<string, unknown>) => api.post('/payments/create-order', data),
  verifyPayment: (data: Record<string, unknown>) => api.post('/payments/verify', data),
  getHistory: () => api.get('/payments/history'),
  validateCoupon: (code: string) => api.post('/payments/validate-coupon', { code }),
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params?: Record<string, unknown>) => api.get('/admin/users', { params }),
  createUser: (data: Record<string, unknown>) => api.post('/admin/users', data),
  updateUser: (id: string, data: Record<string, unknown>) => api.patch(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/admin/users/${id}`),
  suspendUser: (id: string) => api.patch(`/admin/users/${id}/suspend`),
  getPendingListings: () => api.get('/admin/listings/pending'),
  reviewListing: (id: string, action: string, reason?: string) =>
    api.patch(`/admin/listings/${id}/review`, { action, reason }),
  getPendingJobs: () => api.get('/admin/jobs/pending'),
  reviewJob: (id: string, action: string, reason?: string) =>
    api.patch(`/admin/jobs/${id}/review`, { action, reason }),
  getPendingOrganizations: () => api.get('/admin/organizations/pending'),
  verifyOrganization: (id: string, action: string, reason?: string) =>
    api.patch(`/admin/organizations/${id}/verify`, { action, reason }),
  getCoupons: () => api.get('/admin/coupons'),
  createCoupon: (data: Record<string, unknown>) => api.post('/admin/coupons', data),
  toggleCoupon: (id: string) => api.patch(`/admin/coupons/${id}/toggle`),
  getRevenue: () => api.get('/admin/revenue'),
  sendAnnouncement: (data: Record<string, unknown>) => api.post('/admin/announcements', data),
};
// ── Upload ──────────────────────────────────────────────────────────────────
export const uploadAPI = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    // Axios 1.x auto-appends the multipart boundary when Content-Type is set this way
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  // Same endpoint — accepts images or PDFs (e.g. certificate proof documents)
  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ── World Cup Predictions ─────────────────────────────────────────────────────
export const predictionAPI = {
  getBracket: () => api.get('/predictions'),
  pick: (key: string, pickTeam: string) => api.post('/predictions/pick', { key, pickTeam }),
  getMine: () => api.get('/predictions/mine'),
  getLeaderboard: () => api.get('/predictions/leaderboard'),
};
