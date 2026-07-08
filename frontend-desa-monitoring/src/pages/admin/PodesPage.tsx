import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, Filter, LogOut, Settings, Users, Activity,
  ChevronLeft, ChevronRight, ImagePlus, Plus, RefreshCw,
  Map as MapIcon, Edit, CheckCircle, X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import axios from 'axios';
import { Toaster, toast } from 'react-hot-toast';
import UploadPhotoModal from '../../components/admin/UploadPhotoModal';
import DeleteConfirmationModal from '../../components/admin/DeleteConfirmationModal';
import EditSingleDataModal from '../../components/admin/EditSingleDataModal';
import UploadDataModal from '../../components/admin/UploadDataModal';

export default function PodesPage() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();

  // States
  const [data, setData] = useState<any[]>([]);
  const [years, setYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('Semua Status');
  const [selectedKabupaten, setSelectedKabupaten] = useState('Semua Kabupaten');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const itemsPerPage = 30;

  // Photo Upload States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadDataModalOpen, setIsUploadDataModalOpen] = useState(false);
  const [isUpdateModeModal, setIsUpdateModeModal] = useState(false);
  const [selectedDesa, setSelectedDesa] = useState<any>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Filter Options
  const statuses = ['Semua Status', 'Mandiri', 'Maju', 'Berkembang', 'Tertinggal', 'Belum di data'];
  const kabupatens = ['Semua Kabupaten', 'Gowa', 'Bone', 'Maros', 'Takalar', 'Bantaeng', 'Bulukumba', 'Kepulauan Selayar', 'Jeneponto', 'Sinjai', 'Pangkajene Dan Kepulauan', 'Barru', 'Sidenreng Rappang', 'Wajo', 'Soppeng', 'Pinrang', 'Enrekang', 'Luwu', 'Tana Toraja', 'Luwu Utara', 'Luwu Timur', 'Toraja Utara', 'Makassar', 'Parepare', 'Palopo'];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Fetch Available Years
  useEffect(() => {
    axios.get('http://127.0.0.1:8000/api/admin/podes/years', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setYears(res.data);
        if (res.data.length > 0) {
          setSelectedYear(res.data[0]);
        } else {
          setSelectedYear(new Date().getFullYear().toString());
        }
      })
      .catch(err => console.error('Error fetching years:', err));
  }, [token]);

  // Fetch Podes Data
  useEffect(() => {
    if (!selectedYear) return;

    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/admin/podes', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        page: currentPage,
        search: searchQuery,
        status: selectedStatus === 'Semua Status' ? '' : selectedStatus,
        kabupaten: selectedKabupaten === 'Semua Kabupaten' ? '' : selectedKabupaten,
        tahun: selectedYear
      }
    })
      .then(res => {
        setData(res.data.data);
        setTotalPages(res.data.last_page);
        setTotalItems(res.data.total);
      })
      .catch(err => console.error('Error fetching podes data:', err))
      .finally(() => setLoading(false));
  }, [currentPage, searchQuery, selectedStatus, selectedKabupaten, selectedYear, token, refreshKey]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatus, selectedKabupaten, selectedYear]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Mandiri': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Maju': return 'bg-green-100 text-green-800 border-green-200';
      case 'Berkembang': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Tertinggal': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const handleUploadSuccess = (fotoUrl: string) => {
    // Update local data
    setData(data.map(d => {
      if (d.id === selectedDesa.id) {
        return { ...d, has_foto: true, foto_kantor: fotoUrl };
      }
      return d;
    }));
  };

  const handleDeleteSuccess = () => {
    // Update local data
    setData(data.map(d => {
      if (d.id === selectedDesa.id) {
        return { ...d, has_foto: false, foto_kantor: null };
      }
      return d;
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      <Toaster position="top-right" />

      {/* Top Navbar */}
      <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                D
              </div>
              <h1 className="font-bold text-xl text-slate-800 tracking-tight">DesaMonitor <span className="text-brand-500">Admin</span></h1>
            </div>

            <div className="hidden md:flex items-center gap-1">
              <Link to="/admin/podes" className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm transition-colors">
                Data Podes
              </Link>
              {user?.role === 'super_admin' && (
                <Link to="/admin/users" className="px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                  <Users size={16} /> User Control
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/viewer" className="hidden md:flex px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-sm items-center gap-2 transition-colors shadow-sm">
              <MapIcon size={16} /> Ke Halaman Viewer
            </Link>

            <div className="h-6 w-px bg-slate-200 mx-2"></div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800">{user?.name || 'Administrator'}</p>
                <p className="text-xs text-slate-500 capitalize">{user?.role ? user.role.replace('_', ' ') : 'Super Admin'}</p>
              </div>
              <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold border border-indigo-200 overflow-hidden">
                {user?.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.name || 'A').charAt(0).toUpperCase()
                )}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Link to="/admin/settings" className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center" title="Account Settings">
                <Settings size={18} />
              </Link>
              <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8">

        {/* Header Actions */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
              <Activity className="text-brand-500" /> Data Potensi Desa (Podes)
            </h2>
            <p className="text-sm text-slate-500 mt-1">Kelola data status, infrastruktur, dan informasi penting desa se-Sulawesi Selatan.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setIsUpdateModeModal(true);
                setIsUploadDataModalOpen(true);
              }}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm transition-colors"
            >
              <RefreshCw size={16} className="text-slate-500" /> Memperbarui Data
            </button>
            <button
              onClick={() => {
                setIsUpdateModeModal(false);
                setIsUploadDataModalOpen(true);
              }}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"
            >
              <Plus size={18} /> Tambahkan Data Baru
            </button>
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Year Dropdown */}
            <div className="relative">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="appearance-none pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-sm"
              >
                {years.map(y => <option key={y} value={y}>Tahun {y}</option>)}
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">▼</div>
            </div>

            <div className="h-8 w-px bg-slate-200 hidden md:block mx-1"></div>

            {/* Filter Status */}
            <div className="relative">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="appearance-none pl-9 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            {/* Filter Kabupaten */}
            <select
              value={selectedKabupaten}
              onChange={(e) => setSelectedKabupaten(e.target.value)}
              className="appearance-none px-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 cursor-pointer"
            >
              {kabupatens.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {/* Search */}
          <div className="relative w-full md:w-72">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari desa atau kecamatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative min-h-[600px] flex flex-col">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm table-fixed min-w-[1500px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 w-[4%] whitespace-nowrap bg-slate-50">No</th>
                  <th className="px-6 py-4 w-[8%] whitespace-nowrap bg-slate-50">Kode Desa</th>
                  <th className="px-6 py-4 w-[14%] whitespace-nowrap bg-slate-50">Nama Desa</th>
                  <th className="px-6 py-4 w-[10%] whitespace-nowrap bg-slate-50">Kecamatan</th>
                  <th className="px-6 py-4 w-[10%] whitespace-nowrap bg-slate-50">Kabupaten</th>
                  <th className="px-6 py-4 w-[8%] whitespace-nowrap bg-slate-50">Status</th>
                  <th className="px-6 py-4 w-[7%] text-center whitespace-nowrap bg-slate-50">P. Dasar</th>
                  <th className="px-6 py-4 w-[7%] text-center whitespace-nowrap bg-slate-50">Infrastruktur</th>
                  <th className="px-6 py-4 w-[7%] text-center whitespace-nowrap bg-slate-50">Aksesibilitas</th>
                  <th className="px-6 py-4 w-[6%] text-center whitespace-nowrap bg-slate-50">IKG</th>
                  <th className="px-6 py-4 w-[6%] text-center whitespace-nowrap bg-slate-50">Indeks Desa</th>
                  <th className="px-6 py-4 w-[8%] text-center whitespace-nowrap bg-slate-50">Foto Kantor</th>
                  <th className="px-6 py-4 w-[5%] text-center whitespace-nowrap bg-slate-50">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {data.length > 0 ? data.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">{item.kode_desa}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 leading-tight">{item.nama_desa}</td>
                    <td className="px-6 py-4 leading-tight">{item.kecamatan}</td>
                    <td className="px-6 py-4 leading-tight">{item.kabupaten}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border whitespace-nowrap ${getStatusColor(item.status_kesulitan)}`}>
                        {item.status_kesulitan}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-slate-800 whitespace-nowrap">{item.pelayanan_dasar ? Number(item.pelayanan_dasar).toFixed(2) : '-'}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-800 whitespace-nowrap">{item.infrastruktur ? Number(item.infrastruktur).toFixed(2) : '-'}</td>
                    <td className="px-6 py-4 text-center font-medium text-slate-800 whitespace-nowrap">{item.aksesbilitas ? Number(item.aksesbilitas).toFixed(2) : '-'}</td>
                    <td className="px-6 py-4 text-center font-bold text-indigo-600 whitespace-nowrap">{item.ikg ? Number(item.ikg).toFixed(4) : '-'}</td>
                    <td className="px-6 py-4 text-center font-bold text-purple-600 whitespace-nowrap">{item.indeks_desa ? Number(item.indeks_desa).toFixed(4) : '-'}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {item.has_foto ? (
                        <div className="inline-flex items-center">
                          <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-l-lg text-xs font-bold shadow-sm h-7">
                            <CheckCircle size={14} /> Terupload
                          </div>
                          <button
                            onClick={() => { setSelectedDesa(item); setIsDeleteModalOpen(true); }}
                            className="flex items-center justify-center px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-r-lg shadow-sm h-7 transition-colors border-l border-emerald-400"
                            title="Hapus Foto"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setSelectedDesa(item); setIsUploadModalOpen(true); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1 bg-white hover:bg-slate-100 border border-slate-300 text-slate-600 rounded-lg text-xs font-bold transition-colors shadow-sm"
                        >
                          <ImagePlus size={14} /> Tambahkan
                        </button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => { setSelectedDesa(item); setIsEditModalOpen(true); }}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  !loading && (
                    <tr>
                      <td colSpan={13} className="px-6 py-12 text-center text-slate-500">
                        <div className="flex flex-col items-center justify-center">
                          <Search size={32} className="text-slate-300 mb-3" />
                          <p className="font-semibold text-slate-700">Tidak ada data ditemukan</p>
                          <p className="text-sm mt-1">Coba ubah kata kunci pencarian atau filter Anda.</p>
                        </div>
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-bold text-slate-700">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> hingga <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-bold text-slate-700">{totalItems}</span> data
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || totalItems === 0}
                className="p-2 border border-slate-200 bg-white text-slate-600 rounded-lg disabled:opacity-50 disabled:bg-slate-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>

              <div className="flex items-center">
                {totalPages > 0 ? Array.from({ length: totalPages }).map((_, i) => {
                  // Show limited pages logic
                  if (
                    i === 0 ||
                    i === totalPages - 1 ||
                    (i >= currentPage - 2 && i <= currentPage)
                  ) {
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`min-w-[36px] h-9 flex items-center justify-center text-sm font-bold rounded-lg mx-0.5 transition-colors ${currentPage === i + 1
                          ? 'bg-indigo-600 text-white shadow-md'
                          : 'bg-transparent text-slate-600 hover:bg-slate-200'
                          }`}
                      >
                        {i + 1}
                      </button>
                    );
                  } else if (
                    i === currentPage - 3 ||
                    i === currentPage + 1
                  ) {
                    return <span key={i} className="px-1 text-slate-400">...</span>;
                  }
                  return null;
                }) : (
                  <button
                    disabled
                    className="min-w-[36px] h-9 flex items-center justify-center text-sm font-bold rounded-lg mx-0.5 bg-indigo-600 text-white shadow-md opacity-50"
                  >
                    1
                  </button>
                )}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 border border-slate-200 bg-white text-slate-600 rounded-lg disabled:opacity-50 disabled:bg-slate-50 hover:bg-slate-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <UploadPhotoModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        desa={selectedDesa}
        token={token as string}
        onSuccess={handleUploadSuccess}
      />

      <UploadDataModal
        isOpen={isUploadDataModalOpen}
        onClose={() => setIsUploadDataModalOpen(false)}
        token={token as string}
        isUpdateMode={isUpdateModeModal}
        defaultYear={selectedYear}
        existingYears={years}
        onSuccess={(msg, _stats, uploadedYear) => {
          toast.success(msg, { duration: 5000 });

          const yearToFetch = uploadedYear || selectedYear;
          if (uploadedYear) {
            setSelectedYear(uploadedYear);
          }

          // Jika ada tahun baru yang belum ada di list, refresh daftar tahun
          axios.get('http://127.0.0.1:8000/api/admin/podes/years', {
            headers: { Authorization: `Bearer ${token}` }
          }).then(res => {
            setYears(res.data);
          });

          // Refetch data table using the correct year
          setLoading(true);
          axios.get('http://127.0.0.1:8000/api/admin/podes', {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              page: 1,
              search: searchQuery,
              status: selectedStatus === 'Semua Status' ? '' : selectedStatus,
              kabupaten: selectedKabupaten === 'Semua Kabupaten' ? '' : selectedKabupaten,
              tahun: yearToFetch
            }
          })
            .then(res => {
              setCurrentPage(1);
              setData(res.data.data);
              setTotalPages(res.data.last_page);
              setTotalItems(res.data.total);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
        }}
      />

      <DeleteConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        desa={selectedDesa}
        token={token as string}
        onSuccess={handleDeleteSuccess}
      />

      <EditSingleDataModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        token={token as string}
        desaData={selectedDesa}
        year={selectedYear}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
}
