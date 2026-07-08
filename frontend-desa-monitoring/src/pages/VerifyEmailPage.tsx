import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const verifyUrl = searchParams.get('verify_url');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Sedang memverifikasi akun Anda...');

  useEffect(() => {
    if (!verifyUrl) {
      setStatus('error');
      setMessage('Tautan verifikasi tidak valid atau tidak ditemukan.');
      return;
    }

    // Call the backend signed URL
    axios.get(verifyUrl)
      .then(res => {
        setStatus('success');
        setMessage(res.data.message || 'Akun anda telah terverifikasi!');
      })
      .catch(err => {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Gagal memverifikasi akun. Tautan mungkin sudah kedaluwarsa.');
      });
  }, [verifyUrl]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in-95 duration-500">

        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 size={40} className="text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Memproses...</h2>
            <p className="text-slate-500">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center relative z-10">
                <CheckCircle size={56} className="text-green-500" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Akun anda telah terverifikasi!</h2>
            <p className="text-slate-500 mb-8">{message}</p>
            <Link
              to="/"
              className="w-full inline-flex justify-center items-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-indigo-500/30"
            >
              Masuk Sekarang
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-500">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle size={56} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifikasi Gagal</h2>
            <p className="text-slate-500 mb-8">{message}</p>
            <Link
              to="/"
              className="w-full inline-flex justify-center items-center px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all"
            >
              Halaman Login
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}
