import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  no_telp?: string;
  profile_photo_url?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  updateUser: (user: User) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      updateUser: (user) => set({ user }),
      logout: async () => {
        const token = get().token;
        if (token) {
          try {
            await axios.post('http://127.0.0.1:8000/api/logout', {}, {
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (e) {
            console.error('Logout failed:', e);
          }
        }
        set({ token: null, user: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
