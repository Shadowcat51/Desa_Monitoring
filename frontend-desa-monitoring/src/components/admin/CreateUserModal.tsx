import React, { useState, useEffect } from 'react';
import { X, UserPlus, Mail, Phone, Lock, MapPin, Shield } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // call without args to just trigger refresh
}

export default function CreateUserModal({ isOpen, onClose, onSuccess }: CreateUserModalProps) {
  const { token } = useAuthStore();
  const [kabupatens, setKabupatens] = useState<{id: number, nama: string}[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    no_telp: '',
    role: 'pegawai',
    kabupaten: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && kabupatens.length === 0) {
      axios.get('http://127.0.0.1:8000/api/admin/kabupatens', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setKabupatens(res.data)).catch(err => console.error(err));
    }
  }, [isOpen, token]);


  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email.endsWith('@bps.go.id')) {
      toast.error('Email harus menggunakan domain instansi @bps.go.id');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await axios.post('http://127.0.0.1:8000/api/admin/users', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Berhasil membuat akun. Email verifikasi telah dikirim.');
      onSuccess();
      onClose();
      // Reset form
      setFormData({
        email: '',
        no_telp: '',
        role: 'pegawai',
        kabupaten: '',
      });
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Gagal membuat akun.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <UserPlus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Buat Akun Baru</h3>
              <p className="text-xs text-slate-500">Tambahkan pengguna baru ke sistem.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">

            {/* Email & No Telp */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="pl-10 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="nama_pegawai@bps.go.id"
                  />
                </div>
                <p className="text-xs text-indigo-500 mt-1.5 font-medium">*Hanya menerima email instansi BPS (@bps.go.id)</p>
              </div>
              
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">No. Telp / WhatsApp</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone size={16} className="text-slate-400" />
                  </div>
                  <input
                    type="text"
                    name="no_telp"
                    required
                    value={formData.no_telp}
                    onChange={handleChange}
                    className="pl-10 w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
                    placeholder="0812xxxxxxxx"
                  />
                </div>
              </div>
            </div>


            {/* Role & Kabupaten */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Role Pengguna</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield size={16} className="text-slate-400" />
                  </div>
                  <select
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="pl-10 appearance-none w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="admin_prov">Admin Provinsi</option>
                    <option value="admin_kab">Admin Kabupaten</option>
                    <option value="pegawai">Pegawai</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Area / Kabupaten</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPin size={16} className="text-slate-400" />
                  </div>
                  <select
                    name="kabupaten"
                    value={formData.kabupaten}
                    onChange={handleChange}
                    disabled={formData.role === 'super_admin' || formData.role === 'admin_prov'}
                    className="pl-10 appearance-none w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Pilih Kabupaten --</option>
                    {kabupatens.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">*Hanya untuk Admin Kabupaten</p>
              </div>
            </div>

          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-70 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                  Menyimpan...
                </>
              ) : (
                'Buat Akun'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
