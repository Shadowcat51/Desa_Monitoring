import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface EditDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  desaData: any;
  year: string;
  onSuccess: () => void;
}

export default function EditSingleDataModal({ isOpen, onClose, token, desaData, year, onSuccess }: EditDataModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    kode_desa: '',
    nama_desa: '',
    kecamatan: '',
    kabupaten: '',
    status_kesulitan: '',
    pelayanan_dasar: '',
    infrastruktur: '',
    aksesbilitas: '',
    ikg: '',
    indeks_desa: ''
  });

  useEffect(() => {
    if (desaData && isOpen) {
      setFormData({
        kode_desa: desaData.kode_desa || '',
        nama_desa: desaData.nama_desa || '',
        kecamatan: desaData.kecamatan || '',
        kabupaten: desaData.kabupaten || '',
        status_kesulitan: desaData.status_kesulitan || '',
        pelayanan_dasar: desaData.pelayanan_dasar || '',
        infrastruktur: desaData.infrastruktur || '',
        aksesbilitas: desaData.aksesbilitas || '',
        ikg: desaData.ikg || '',
        indeks_desa: desaData.indeks_desa || ''
      });
    }
  }, [desaData, isOpen]);

  if (!isOpen || !desaData) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await axios.put(`http://127.0.0.1:8000/api/admin/podes/${desaData.id}`, 
        { ...formData, tahun: year },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      toast.success('Data desa berhasil diperbarui!');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-800">Edit Data Desa</h3>
            <p className="text-xs text-slate-500 mt-1">Mengedit data untuk Tahun {year}</p>
          </div>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <form id="edit-form" onSubmit={handleSubmit} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kode Desa</label>
                <input 
                  type="text" 
                  name="kode_desa" 
                  value={formData.kode_desa} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nama Desa / Kelurahan <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="nama_desa" 
                  required
                  value={formData.nama_desa} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kecamatan <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="kecamatan" 
                  required
                  value={formData.kecamatan} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kabupaten <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  name="kabupaten" 
                  required
                  value={formData.kabupaten} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                />
              </div>
            </div>

            <div className="h-px w-full bg-slate-100 my-2"></div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status (Kategori Indeks Desa)</label>
              <select 
                name="status_kesulitan" 
                value={formData.status_kesulitan} 
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">-- Pilih Status --</option>
                <option value="Mandiri">Mandiri</option>
                <option value="Maju">Maju</option>
                <option value="Berkembang">Berkembang</option>
                <option value="Tertinggal">Tertinggal</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skor Pelayanan Dasar</label>
                <input 
                  type="number" 
                  step="0.0001"
                  name="pelayanan_dasar" 
                  value={formData.pelayanan_dasar} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skor Infrastruktur</label>
                <input 
                  type="number" 
                  step="0.0001"
                  name="infrastruktur" 
                  value={formData.infrastruktur} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Skor Aksesbilitas</label>
                <input 
                  type="number" 
                  step="0.0001"
                  name="aksesbilitas" 
                  value={formData.aksesbilitas} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">IKG (Indeks Kesulitan Geografis)</label>
                <input 
                  type="number" 
                  step="0.0001"
                  name="ikg" 
                  value={formData.ikg} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-lg text-sm font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Indeks Desa</label>
                <input 
                  type="number" 
                  step="0.0001"
                  name="indeks_desa" 
                  value={formData.indeks_desa} 
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
                />
              </div>
            </div>

            <div className="flex items-start gap-2 mt-4 p-3 bg-amber-50 rounded-lg text-xs text-amber-700 border border-amber-200">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <p>Perubahan pada Nama Desa, Kecamatan, atau Kabupaten akan mempengaruhi seluruh sistem dan Peta. Pastikan data yang dimasukkan sudah benar.</p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="submit"
            form="edit-form"
            disabled={isSubmitting}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-indigo-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} /> Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
