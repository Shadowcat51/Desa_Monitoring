import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, FileImage, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface UploadPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  desa: any;
  token: string;
  onSuccess: (fotoUrl: string) => void;
}

export default function UploadPhotoModal({ isOpen, onClose, desa, token, onSuccess }: UploadPhotoModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (selectedFile: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setError('Tipe file tidak didukung. Gunakan JPG, PNG, atau WEBP.');
      return false;
    }
    // 50MB
    if (selectedFile.size > 50 * 1024 * 1024) {
      setError('Ukuran file terlalu besar. Maksimal 50MB.');
      return false;
    }
    setError(null);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selectedFile = e.dataTransfer.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (validateFile(selectedFile)) {
        setFile(selectedFile);
      }
    }
  };

  const onUpload = async () => {
    if (!file || !desa) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('foto', file);

    try {
      const response = await axios.post(
        `http://127.0.0.1:8000/api/admin/podes/${desa.id}/foto`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      toast.success('Foto berhasil diunggah!');
      onSuccess(response.data.foto_kantor);
      setTimeout(() => {
        setFile(null);
        onClose();
      }, 500);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Gagal mengunggah foto.');
      setError(err.response?.data?.message || 'Terjadi kesalahan saat mengunggah foto.');
    } finally {
      setUploading(false);
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
            onClick={() => { if(!uploading) onClose(); }}
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
              <h3 className="font-bold text-slate-800 text-lg">Upload Foto Kantor Desa</h3>
              <button 
                onClick={onClose}
                disabled={uploading}
                className="text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className="p-6">
              <p className="text-sm text-slate-500 mb-4">
                Unggah foto untuk desa <span className="font-bold text-slate-700">{desa?.nama_desa}</span>. 
              </p>

              {!file ? (
                <div 
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  className={`
                    border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                    ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-slate-50'}
                    ${error ? 'border-red-400 bg-red-50' : ''}
                  `}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleChange}
                  />
                  <UploadCloud size={40} className={`mb-3 ${dragActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                  <p className="font-semibold text-slate-700">Tarik & lepas foto ke sini</p>
                  <p className="text-xs text-slate-500 mt-1">atau klik untuk mencari file</p>
                  <p className="text-[10px] text-slate-400 mt-4 font-mono">JPG, PNG, WEBP (Max 50MB)</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl p-4 flex items-center gap-4 bg-slate-50">
                  <div className="w-12 h-12 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                    <FileImage size={24} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-700 text-sm truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                  {!uploading && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setFile(null); setError(null); }}
                      className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-3 flex items-start gap-2 text-red-600 text-xs bg-red-50 p-3 rounded-lg border border-red-100">
                  <AlertCircle size={14} className="shrink-0 mt-0.5" />
                  <p>{error}</p>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                disabled={uploading}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button 
                onClick={onUpload}
                disabled={!file || uploading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengunggah...
                  </>
                ) : (
                  <>Simpan Foto</>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
