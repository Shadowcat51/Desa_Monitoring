import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, Camera, 
  Save, Key, User, Phone, Shield
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Toaster, toast } from 'react-hot-toast';
import axios from 'axios';
import PhotoCropModal from '../../components/admin/PhotoCropModal';

export default function AccountSettingsPage() {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuthStore();
  
  // States for form
  const [username, setUsername] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.no_telp || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);

  // States for Photo Crop
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);

  // State for confirm modal
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  
  // Check if there are changes
  const hasChanges = username !== (user?.name || '') || phone !== (user?.no_telp || '');

  const handleSave = async () => {
    if (!hasChanges) return;
    
    setIsLoading(true);
    try {
      const response = await axios.put('http://127.0.0.1:8000/api/admin/profile', {
        name: username,
        no_telp: phone
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      updateUser(response.data.user);
      toast.success('Pengaturan akun berhasil disimpan!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal menyimpan pengaturan akun');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => setSelectedImageSrc(reader.result?.toString() || null));
      reader.readAsDataURL(file);
      // Reset input value so same file can be selected again
      e.target.value = '';
    }
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setSelectedImageSrc(null); // close modal
    const toastId = toast.loading('Mengunggah foto profil...');
    
    try {
      const formData = new FormData();
      formData.append('photo', croppedBlob, 'profile.jpg');

      const response = await axios.post('http://127.0.0.1:8000/api/admin/profile/photo', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      updateUser(response.data.user);
      toast.success('Foto profil berhasil diperbarui!', { id: toastId });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal mengunggah foto profil', { id: toastId });
    }
  };

  const handleRequestPasswordReset = () => {
    setIsConfirmResetOpen(true);
  };

  const executeRequestPasswordReset = async () => {
    setIsConfirmResetOpen(false);
    setIsPasswordLoading(true);
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/admin/password/request-reset', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.status === 'already_sent') {
        toast(response.data.message, { icon: 'ℹ️' });
      } else {
        toast.success(response.data.message);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Gagal meminta reset password');
    } finally {
      setIsPasswordLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-50 font-sans flex flex-col relative">
      <Toaster position="top-right" />
      
      {/* Hidden file input for photo upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="image/*" 
        className="hidden" 
      />

      {/* Crop Modal */}
      {selectedImageSrc && (
        <PhotoCropModal 
          imageSrc={selectedImageSrc} 
          onClose={() => setSelectedImageSrc(null)}
          onCropComplete={handleCropComplete}
        />
      )}

      {/* Absolute Minimal Header in Top Left */}
      <nav className="absolute top-0 left-0 w-full p-6 z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate(user?.role === 'pegawai' ? '/viewer' : '/admin/podes')} 
            className="p-2 text-slate-500 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors flex items-center gap-1 font-semibold text-sm"
          >
            <ChevronLeft size={20} />
            Kembali
          </button>
          
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-xl text-slate-800 tracking-tight">
              {user?.role === 'pegawai' ? 'DataMonitor' : <>DesaMonitor <span className="text-brand-500">Admin</span></>}
            </h1>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-6 mt-8 relative z-10">
        <div className="w-full max-w-[800px] mb-6 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">Pengaturan Akun</h2>
          <p className="text-slate-500 mt-1">Kelola informasi profil dan keamanan akun Anda.</p>
        </div>

        <div className="w-full max-w-[800px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          
          {/* Header Section */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32 relative"></div>
          
          <div className="px-8 pb-8">
            {/* Profile Picture */}
            <div className="relative -mt-16 mb-8 flex justify-between items-end">
              <div className="relative group">
                <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-lg">
                  <div className="w-full h-full rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-4xl font-bold border border-slate-200 overflow-hidden relative">
                    {user?.profile_photo_url ? (
                      <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      (user?.name || 'A').charAt(0).toUpperCase()
                    )}
                    {/* Overlay on hover */}
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute inset-0 bg-slate-900/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera className="text-white" size={28} />
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-1 right-1 p-2 bg-white rounded-full shadow-md border border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-colors"
                >
                  <Camera size={16} />
                </button>
              </div>
              
              <div className="pb-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full text-sm font-bold shadow-sm">
                  <Shield size={16} />
                  {user?.role ? user.role.replace('_', ' ').toUpperCase() : 'ADMINISTRATOR'}
                </span>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-slate-400" /> Username / Nama
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="Masukkan nama Anda"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Phone size={16} className="text-slate-400" /> Nomor Telepon
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all font-medium"
                    placeholder="Contoh: 081234567890"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">Email Akun (Tidak dapat diubah)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                />
              </div>
              
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <button 
                  onClick={handleRequestPasswordReset}
                  disabled={isPasswordLoading}
                  className={`w-full sm:w-auto px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-sm ${
                    isPasswordLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-slate-50'
                  }`}
                >
                  <Key size={18} className={isPasswordLoading ? "animate-pulse text-indigo-500" : "text-slate-400"} /> 
                  {isPasswordLoading ? 'Memproses...' : 'Ganti Password'}
                </button>
                
                <button 
                  onClick={handleSave}
                  disabled={!hasChanges || isLoading}
                  className={`w-full sm:w-auto px-8 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md transition-all ${
                    hasChanges && !isLoading
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white hover:-translate-y-0.5' 
                      : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                  }`}
                >
                  <Save size={18} />
                  {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Confirmation Modal */}
      {isConfirmResetOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center transform transition-all">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Ganti Password</h3>
            <p className="text-sm text-slate-500 mb-6">
              Anda yakin ingin mengganti password? Kami akan mengirimkan tautan reset ke email Anda.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setIsConfirmResetOpen(false)}
                className="px-6 py-2.5 font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={executeRequestPasswordReset}
                className="px-6 py-2.5 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Setuju
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
