import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, Lock, ArrowRight, Loader2, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Email, 2: New Password, 3: Success
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://127.0.0.1:8000/api/check-email', { email });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email tidak terdaftar');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await axios.post('http://127.0.0.1:8000/api/reset-password', { email, password });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mereset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-50 font-sans p-4 sm:p-8">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[120px] mix-blend-multiply animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>

      <div className="relative z-10 w-full max-w-md p-8 sm:p-10">
        <div className="bg-white/90 backdrop-blur-xl border border-white shadow-2xl rounded-[2rem] p-8 sm:p-10 transform transition-all hover:shadow-indigo-500/10 duration-500">
          
          <div className="mb-6">
            <Link to="/" className="inline-flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
              <ArrowLeft size={16} className="mr-1" /> Kembali ke Login
            </Link>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Lupa Password</h1>
            <p className="text-slate-500 text-sm font-medium">
              {step === 1 && "Masukkan email Anda untuk memverifikasi akun."}
              {step === 2 && "Masukkan password baru Anda."}
              {step === 3 && "Password berhasil diubah!"}
            </p>
          </div>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium text-center shadow-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleCheckEmail} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Email Anda</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Mail size={22} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all placeholder-slate-400 text-lg shadow-inner"
                    placeholder="nama@instansi.go.id"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !email}
                className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <span>Lanjut</span>}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Password Baru</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                    <Lock size={22} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-14 pr-12 py-4 bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all placeholder-slate-400 text-lg shadow-inner"
                    placeholder="Minimal 6 karakter"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || password.length < 6}
                className="w-full py-4 mt-2 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <span>Ubah Password</span>}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 size={40} />
              </div>
              <p className="text-slate-600 mb-8 font-medium">Anda sekarang dapat masuk menggunakan password baru Anda.</p>
              <Link 
                to="/" 
                className="inline-flex w-full py-4 bg-slate-800 hover:bg-slate-900 text-white text-lg font-bold rounded-2xl justify-center transition-colors"
              >
                Kembali ke Login
              </Link>
            </div>
          )}
          
        </div>
      </div>
    </div>
  );
}
