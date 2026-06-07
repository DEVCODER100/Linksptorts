import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  email: string;
  role: 'athlete' | 'coach' | 'professional' | 'organization' | 'admin';
  isVerified: boolean;
}

interface AuthState {
  user: User | null;
  profile: Record<string, unknown> | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Record<string, unknown> | null) => void;
  setAccessToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      accessToken: null,
      isLoading: false,
      isAuthenticated: false,

      setUser: (user) => {
        const u = user ? { ...user, id: (user as any).id || (user as any)._id } : null;
        set({ user: u, isAuthenticated: !!u });
      },
      setProfile: (profile) => set({ profile }),
      setAccessToken: (accessToken) => {
        set({ accessToken });
        if (accessToken) localStorage.setItem('accessToken', accessToken);
        else localStorage.removeItem('accessToken');
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authAPI.login({ email, password });
          const { accessToken, user } = response.data.data;
          const u = { ...user, id: user.id || user._id };
          localStorage.setItem('accessToken', accessToken);
          set({ user: u, accessToken, isAuthenticated: true, isLoading: false });
          await get().fetchMe();
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authAPI.logout();
        } catch {}
        localStorage.removeItem('accessToken');
        set({ user: null, profile: null, accessToken: null, isAuthenticated: false });
      },

      fetchMe: async () => {
        try {
          const response = await authAPI.getMe();
          const { user, profile } = response.data.data;
          const u = { ...user, id: user.id || user._id };
          set({ user: u, profile, isAuthenticated: true });
        } catch (error: unknown) {
          // Only clear auth on explicit 401 — network errors / 5xx should not log the user out
          const status = (error as { response?: { status?: number } })?.response?.status;
          if (status === 401) {
            set({ user: null, profile: null, accessToken: null, isAuthenticated: false });
            localStorage.removeItem('accessToken');
          }
        }
      },

      reset: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, profile: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'linksports-auth',
      partialize: (state) => ({ user: state.user, accessToken: state.accessToken, isAuthenticated: state.isAuthenticated }),
    }
  )
);
