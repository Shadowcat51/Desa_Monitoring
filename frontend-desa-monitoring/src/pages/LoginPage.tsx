import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Activity, Lock, Mail, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import VillageCharacter from '../components/VillageCharacter';

const bgImages = ['2.webp', '3.webp', '4.webp', '5.webp', '6.webp', '7.webp'];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [status, setStatus] = useState<'idle' | 'greeting' | 'error'>('greeting');
  const [step, setStep] = useState<'login' | 'verify' | 'forgot-email' | 'forgot-verify' | 'forgot-reset'>('login');
  const [verificationCode, setVerificationCode] = useState('');
  
  // States for Forgot Password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [bgIndex, setBgIndex] = useState(0);
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();

  useEffect(() => {
    // Stop greeting after 3 seconds
    const timer = setTimeout(() => {
      if (status === 'greeting') setStatus('idle');
    }, 3000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    // Background slider every 2 seconds
    const interval = setInterval(() => {
      setBgIndex(prev => {
        let next = Math.floor(Math.random() * bgImages.length);
        while (next === prev) {
          next = Math.floor(Math.random() * bgImages.length);
        }
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth) * 2 - 1;
    const y = (e.clientY / window.innerHeight) * 2 - 1;
    setMousePos({ x, y });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setStatus('idle');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', {
        email,
        password,
      });

      if (response.data.status === 'verification_required') {
        setSuccessMsg(response.data.message);
        setStep('verify');
      } else {
        // Fallback if not using verification
        const { access_token, user } = response.data;
        setAuth(access_token, user);
        navigate('/viewer');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal login. Periksa kembali email dan password Anda.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/verify-login', {
        email,
        code: verificationCode
      });

      const { access_token, user } = response.data;
      setAuth(access_token, user);
      navigate('/viewer');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kode verifikasi salah atau kedaluwarsa.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/resend-verification', {
        email
      });
      setSuccessMsg(response.data.message);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang kode.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/password/forgot-request', { email: forgotEmail });
      setSuccessMsg(response.data.message);
      setStep('forgot-verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal meminta kode reset.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/password/forgot-verify', {
        email: forgotEmail,
        code: forgotCode
      });
      setSuccessMsg(response.data.message);
      setStep('forgot-reset');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Kode salah atau kadaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    if (newPassword !== newPasswordConfirm) {
      setError('Konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/password/forgot-reset', {
        email: forgotEmail,
        code: forgotCode,
        password: newPassword,
        password_confirmation: newPasswordConfirm
      });
      setSuccessMsg(response.data.message);
      
      // Successfully changed, reset all states and go to login
      setTimeout(() => {
        setForgotEmail('');
        setForgotCode('');
        setNewPassword('');
        setNewPasswordConfirm('');
        setStep('login');
      }, 2000);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mereset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 font-sans p-4 sm:p-8"
      onMouseMove={handleMouseMove}
    >
      {/* Background Images Slider */}
      {bgImages.map((img, idx) => (
        <div
          key={img}
          className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out ${idx === bgIndex ? 'opacity-100' : 'opacity-0'}`}
          style={{ backgroundImage: `url('/foto_background/${img}')` }}
        />
      ))}

      {/* Shadowbox Overlay for contrast */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm mix-blend-multiply"></div>

      {/* Dynamic Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-500/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/20 blur-[120px] mix-blend-screen animate-pulse pointer-events-none" style={{ animationDuration: '6s', animationDelay: '1s' }}></div>

      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .animate-float {
          animation: float 5s ease-in-out infinite;
        }
      `}</style>

      {/* Landscape Split Layout */}
      <div className="relative z-10 w-full max-w-5xl flex flex-col md:flex-row bg-white/80 backdrop-blur-xl border border-white shadow-2xl rounded-[2rem] overflow-hidden transform transition-all hover:shadow-indigo-500/10 duration-500 min-h-[650px]">

        {/* Left Side: Illustration */}
        <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-indigo-50 to-blue-50 p-12 flex-col items-center justify-center relative border-r border-slate-100">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>

          <div className="relative z-10 w-full max-w-sm h-64 flex items-center justify-center">
            <VillageCharacter mouseX={mousePos.x} mouseY={mousePos.y} status={status} />
          </div>

          <div className="mt-10 text-center relative z-10">
            <h2 className="text-2xl font-extrabold text-indigo-900 mb-2">Pantau Desa dengan Mudah</h2>
            <p className="text-indigo-700/80 text-sm font-medium leading-relaxed max-w-xs mx-auto">
              Akses informasi terkini mengenai status pembangunan, ekonomi, dan potensi desa di seluruh Sulawesi Selatan secara terpusat.
            </p>
          </div>
        </div>

        {/* Right Side: Form Container */}
        <div className="w-full md:w-1/2 overflow-hidden relative">
          <div 
            className="w-[500%] h-full flex transition-transform duration-700 ease-in-out"
            style={{ 
              transform: step === 'login' ? 'translateX(0)' : 
                         step === 'verify' ? 'translateX(-20%)' :
                         step === 'forgot-email' ? 'translateX(-40%)' :
                         step === 'forgot-verify' ? 'translateX(-60%)' :
                         'translateX(-80%)'
            }}
          >
            {/* Step 1: Login Form */}
            <div className="w-1/5 p-10 sm:p-14 flex flex-col justify-center">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/30 transform -rotate-6 hover:rotate-0 transition-transform duration-300 md:hidden">
                  <Activity className="text-white" size={32} />
                </div>
                <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">DesaMonitor</h1>
                <p className="text-slate-500 text-base font-medium">Masuk ke Dasbor Kami</p>
              </div>

              {error && step === 'login' && (
                <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium text-center shadow-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Email</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Mail size={22} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-14 pr-5 py-4 bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all placeholder-slate-400 text-lg shadow-inner"
                  placeholder="nama@bps.go.id"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Password</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-500 transition-colors">
                  <Lock size={22} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-14 pr-12 py-4 bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all placeholder-slate-400 text-lg shadow-inner"
                  placeholder="Masukkan Password"
                  required
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
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setError('');
                    setSuccessMsg('');
                    setStep('forgot-email');
                  }}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Lupa Password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 mt-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={24} />
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={22} />
                </>
              )}
            </button>
          </form>

            <div className="mt-10 text-center">
              <p className="text-sm text-slate-500 font-medium">
                Akses terbatas hanya untuk administrator dan pegawai yang terdaftar.<br />Hubungi Super Admin jika Anda belum memiliki akun.
              </p>
            </div>
          </div>

          {/* Step 2: Verification Form */}
          <div className="w-1/5 p-10 sm:p-14 flex flex-col justify-center">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-indigo-600" size={32} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Verifikasi 2 Langkah</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Kode 6-digit telah dikirim ke email <strong>{email}</strong>.<br/>Berlaku selama 10 menit.
              </p>
            </div>

            {successMsg && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-600 text-sm font-medium text-center shadow-sm">
                {successMsg}
              </div>
            )}
            
            {error && step === 'verify' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium text-center shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleVerifyCode} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Kode Verifikasi</label>
                <input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-4 text-center tracking-[1em] text-3xl font-extrabold bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-indigo-500 transition-all shadow-inner placeholder-slate-300"
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full py-5 mt-4 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-indigo-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    <span>Verifikasi & Masuk</span>
                    <ArrowRight size={22} />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <button
                onClick={handleResendCode}
                disabled={loading}
                className="text-sm font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
              >
                Kirim Ulang Kode
              </button>
              <div className="block">
                <button
                  onClick={() => {
                    setStep('login');
                    setVerificationCode('');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Batal dan kembali
                </button>
              </div>
            </div>
          </div>

          {/* Step 3: Forgot Password - Email Form */}
          <div className="w-1/5 p-10 sm:p-14 flex flex-col justify-center">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="text-blue-600" size={32} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Lupa Password</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Masukkan email Anda yang terdaftar.<br/>Kami akan mengirimkan kode 6-digit untuk meresetnya.
              </p>
            </div>

            {error && step === 'forgot-email' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium text-center shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotRequest} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Email Anda</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={22} />
                  </div>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full pl-14 pr-5 py-4 bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 transition-all placeholder-slate-400 text-lg shadow-inner"
                    placeholder="nama@bps.go.id"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !forgotEmail}
                className="w-full py-5 mt-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <span>Kirim Kode</span>}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  setStep('login');
                  setError('');
                }}
                className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
              >
                Kembali ke Login
              </button>
            </div>
          </div>

          {/* Step 4: Forgot Password - Verify Code */}
          <div className="w-1/5 p-10 sm:p-14 flex flex-col justify-center">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-yellow-600" size={32} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Verifikasi Reset</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Masukkan kode 6-digit yang kami kirimkan ke <strong>{forgotEmail}</strong>.
              </p>
            </div>

            {successMsg && step === 'forgot-verify' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-600 text-sm font-medium text-center shadow-sm">
                {successMsg}
              </div>
            )}
            
            {error && step === 'forgot-verify' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium text-center shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotVerify} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Kode Verifikasi</label>
                <input
                  type="text"
                  maxLength={6}
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-4 text-center tracking-[1em] text-3xl font-extrabold bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:bg-white focus:border-yellow-500 transition-all shadow-inner placeholder-slate-300"
                  placeholder="000000"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading || forgotCode.length !== 6}
                className="w-full py-5 mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-yellow-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <span>Lanjutkan</span>}
              </button>
            </form>

            <div className="mt-8 text-center space-y-4">
              <button
                onClick={handleForgotRequest}
                disabled={loading}
                className="text-sm font-bold text-yellow-600 hover:text-yellow-700 transition-colors disabled:opacity-50"
              >
                Kirim Ulang Kode
              </button>
              <div className="block">
                <button
                  onClick={() => {
                    setStep('login');
                    setForgotCode('');
                    setError('');
                    setSuccessMsg('');
                  }}
                  className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
                >
                  Batal dan kembali
                </button>
              </div>
            </div>
          </div>

          {/* Step 5: Forgot Password - Reset Password */}
          <div className="w-1/5 p-10 sm:p-14 flex flex-col justify-center">
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock className="text-emerald-600" size={32} />
              </div>
              <h2 className="text-3xl font-extrabold text-slate-800 mb-3 tracking-tight">Buat Password Baru</h2>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                Buat password baru dengan minimal 8 karakter.
              </p>
            </div>

            {successMsg && step === 'forgot-reset' && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl text-green-600 text-sm font-medium text-center shadow-sm">
                {successMsg}
              </div>
            )}
            
            {error && step === 'forgot-reset' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm font-medium text-center shadow-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleForgotReset} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Password Baru</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Lock size={22} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-14 pr-12 py-4 bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-all placeholder-slate-400 text-lg shadow-inner"
                    placeholder="Minimal 8 karakter"
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 uppercase tracking-widest pl-1">Konfirmasi Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-emerald-500 transition-colors">
                    <Lock size={22} />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPasswordConfirm}
                    onChange={(e) => setNewPasswordConfirm(e.target.value)}
                    className="w-full pl-14 pr-12 py-4 bg-slate-100/50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white focus:border-emerald-500 transition-all placeholder-slate-400 text-lg shadow-inner"
                    placeholder="Ulangi password baru"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-emerald-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !newPassword || !newPasswordConfirm}
                className="w-full py-5 mt-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-lg font-bold rounded-2xl shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {loading ? <Loader2 className="animate-spin" size={24} /> : <span>Simpan Password</span>}
              </button>
            </form>
          </div>
          </div>
        </div>
      </div>
    </div>
  );
}
