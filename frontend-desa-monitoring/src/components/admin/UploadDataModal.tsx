import React, { useState, useRef } from 'react';
import axios from 'axios';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface UploadDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string;
  defaultYear?: string;
  isUpdateMode?: boolean;
  existingYears?: string[];
  onSuccess: (message: string, stats?: { inserted: number; updated: number; skipped: number }, uploadedYear?: string) => void;
}

export default function UploadDataModal({ isOpen, onClose, token, defaultYear, isUpdateMode, existingYears = [], onSuccess }: UploadDataModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState<string>(defaultYear || new Date().getFullYear().toString());
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (defaultYear) {
      setYear(defaultYear);
    }
  }, [defaultYear, isOpen]);

  if (!isOpen) return null;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // xlsx
      'application/vnd.ms-excel', // xls
      'text/csv' // csv
    ];
    
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error('Format file tidak didukung. Harap unggah file Excel (.xlsx, .xls) atau CSV.');
      return;
    }
    
    if (selectedFile.size > 50 * 1024 * 1024) {
      toast.error('Ukuran file terlalu besar. Maksimal 50MB.');
      return;
    }
    
    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Harap pilih file terlebih dahulu.');
      return;
    }

    if (!year) {
      toast.error('Harap masukkan tahun data.');
      return;
    }

    if (!isUpdateMode && existingYears.includes(year)) {
      toast.error(`Data Podes untuk Tahun ${year} sudah ada. Silakan gunakan tombol 'Memperbarui Data'.`);
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('tahun', year);

    try {
      const response = await axios.post('http://127.0.0.1:8000/api/admin/podes/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const { message, inserted, updated, skipped } = response.data;
      onSuccess(message || 'Data berhasil diunggah.', { inserted, updated, skipped }, year);
      handleClose();
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Terjadi kesalahan saat mengunggah data.';
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setYear(new Date().getFullYear().toString());
    onClose();
  };

  // Generate years from 2020 to current + 2
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 10 }, (_, i) => (currentYear - 5 + i).toString());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            {isUpdateMode ? 'Memperbarui Data Podes' : 'Tambahkan Data Baru (Podes)'}
          </h3>
          <button 
            onClick={handleClose}
            disabled={isUploading}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 mb-6">
            Unggah file Excel berisi Data Potensi Desa atau Draft IKG. Pastikan format kolom sesuai dengan template standar.
          </p>

          {/* Year Input */}
          <div className="mb-6">
            <label className="block text-sm font-bold text-slate-700 mb-2">Pilih Tahun Data</label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              disabled={isUploading || isUpdateMode}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>Tahun {y}</option>
              ))}
            </select>
          </div>

          {/* Drag & Drop Zone */}
          <div className="mb-2">
            <label className="block text-sm font-bold text-slate-700 mb-2">File Excel / CSV</label>
            
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".xlsx,.xls,.csv" 
              className="hidden" 
            />

            {!file ? (
              <div 
                onClick={() => !isUploading && fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 flex flex-col items-center justify-center gap-3
                  ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
                  ${isUploading ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Pilih file atau drag & drop ke sini</p>
                  <p className="text-xs text-slate-500 mt-1">Mendukung format .xlsx, .xls, .csv (Maks 50MB)</p>
                </div>
              </div>
            ) : (
              <div className="border border-indigo-200 bg-indigo-50 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                    <FileText size={20} />
                  </div>
                  <div className="truncate">
                    <p className="text-sm font-bold text-slate-800 truncate">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                {!isUploading && (
                  <button 
                    onClick={() => setFile(null)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors shrink-0"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-start gap-2 mt-4 text-xs text-slate-500">
            <AlertCircle size={14} className="shrink-0 text-amber-500 mt-0.5" />
            <p>Data baru akan otomatis dicocokkan dengan database berdasarkan Nama Kabupaten, Kecamatan, dan Desa.</p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl shadow-md shadow-indigo-600/20 transition-all flex items-center gap-2 disabled:opacity-70 disabled:hover:bg-indigo-600"
          >
            {isUploading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Sedang Mengunggah...
              </>
            ) : (
              <>
                <CheckCircle2 size={16} /> Unggah & Simpan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
