import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import { KeyRound, Lock, Eye, EyeOff } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      toast.error('Link reset password tidak valid atau sudah kedaluwarsa.');
    }
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password.length < 8) {
      return toast.error('Password minimal 8 karakter');
    }
    
    if (password !== passwordConfirmation) {
      return toast.error('Konfirmasi password tidak cocok');
    }

    setIsLoading(true);
    
    try {
      await axios.post('http://127.0.0.1:8000/api/admin/password/reset', {
        token,
        email,
        password,
        password_confirmation: passwordConfirmation
      });
      
      toast.success('Password berhasil direset! Silakan login kembali.');
      
      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate('/');
      }, 2000);
      
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mereset password');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token || !email) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans p-6">
        <Toaster position="top-right" />
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Akses Ditolak</h2>
          <p className="text-slate-500 mb-6">Link reset password tidak valid atau tidak lengkap.</p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors w-full"
          >
            Kembali ke Halaman Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center font-sans p-6">
      <Toaster position="top-right" />
      
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Buat Password Baru</h2>
          <p className="text-slate-500 mt-2 text-sm">
            Silakan masukkan password baru untuk akun <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Password Baru</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                placeholder="Minimal 8 karakter"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Konfirmasi Password Baru</label>
            <input
              type={showPassword ? "text" : "password"}
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
              placeholder="Ketik ulang password baru"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all mt-4 ${
              isLoading 
                ? 'bg-indigo-400 cursor-not-allowed text-white' 
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:-translate-y-0.5'
            }`}
          >
            {isLoading ? 'Memproses...' : 'Simpan Password Baru'}
          </button>
        </form>
      </div>
    </div>
  );
}
