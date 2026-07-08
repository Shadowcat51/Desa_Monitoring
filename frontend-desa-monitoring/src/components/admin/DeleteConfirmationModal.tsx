import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  desa: any;
  token: string;
  onSuccess: () => void;
}

export default function DeleteConfirmationModal({ isOpen, onClose, desa, token, onSuccess }: DeleteConfirmationModalProps) {
  const [deleting, setDeleting] = useState(false);

  const onDelete = async () => {
    if (!desa) return;
    
    setDeleting(true);
    try {
      await axios.delete(`http://127.0.0.1:8000/api/admin/podes/${desa.id}/foto`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      toast.success('Foto berhasil dihapus.');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal menghapus foto.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => { if(!deleting) onClose(); }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <AlertTriangle className="text-red-500" size={20} />
                Konfirmasi Hapus
              </h3>
              <button 
                onClick={onClose}
                disabled={deleting}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-slate-600">
                Apakah Anda yakin ingin menghapus foto kantor untuk desa <span className="font-bold text-slate-800">{desa?.nama_desa}</span>? 
                Tindakan ini akan menghapus file dari server secara permanen.
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                disabled={deleting}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={onDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>Ya, Hapus Foto</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
