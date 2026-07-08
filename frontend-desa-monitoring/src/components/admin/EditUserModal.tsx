import React, { useState, useEffect } from 'react';
import { X, UserCog, Shield, Trash2, AlertTriangle, MapPin } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export default function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const { token } = useAuthStore();
  const [role, setRole] = useState('pegawai');
  const [kabupaten, setKabupaten] = useState('');
  const [kabupatens, setKabupatens] = useState<{id: number, nama: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  useEffect(() => {
    if (isOpen && kabupatens.length === 0) {
      axios.get('http://127.0.0.1:8000/api/admin/kabupatens', {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => setKabupatens(res.data)).catch(err => console.error(err));
    }
  }, [isOpen, token]);

  useEffect(() => {
    if (user) {
      setRole(user.role);
      setKabupaten(user.assigned_kabupaten_id ? user.assigned_kabupaten_id.toString() : '');
      setIsConfirmingDelete(false);
      setIsSubmitting(false);
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.put(`http://127.0.0.1:8000/api/admin/users/${user.id}/role`, { role, kabupaten }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Role pengguna berhasil diperbarui.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Gagal memperbarui role pengguna.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsSubmitting(true);
    try {
      await axios.delete(`http://127.0.0.1:8000/api/admin/users/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Akun pengguna berhasil dihapus permanen.');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.message || 'Gagal menghapus pengguna.';
      toast.error(msg);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
              <UserCog size={20} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Kelola Pengguna</h3>
              <p className="text-xs text-slate-500">Ubah role atau hapus akun.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Info Context */}
        <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-lg uppercase">
              {user.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-800">{user.name}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
        </div>

        {isConfirmingDelete ? (
          <div className="p-6">
            <div className="flex flex-col items-center text-center space-y-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-800">Hapus Permanen?</h4>
                <p className="text-sm text-slate-500 mt-1">
                  Anda yakin ingin menghapus akun <strong>{user.name}</strong>? Tindakan ini tidak dapat dibatalkan dan pengguna tidak akan bisa login kembali.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
                disabled={isSubmitting}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Akun'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdateRole} className="p-6">
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Role Pengguna</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield size={16} className="text-slate-400" />
                  </div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="pl-10 appearance-none w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer"
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
                    value={kabupaten}
                    onChange={(e) => setKabupaten(e.target.value)}
                    disabled={role === 'super_admin' || role === 'admin_prov'}
                    className="pl-10 appearance-none w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Pilih Kabupaten --</option>
                    {kabupatens.map(k => (
                      <option key={k.id} value={k.id}>{k.nama}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">*Hanya untuk Admin Kabupaten/Pegawai</p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                disabled={isSubmitting}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-bold text-sm transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Hapus Akun
              </button>
              
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || (role === user.role && kabupaten === (user.assigned_kabupaten_id?.toString() || ''))}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Simpan
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
