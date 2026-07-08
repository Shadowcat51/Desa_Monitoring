import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Settings, Users, Shield, 
  Map as MapIcon, Edit, Search, Filter,
  UserPlus, CheckCircle, XCircle, Clock,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Toaster, toast } from 'react-hot-toast';
import CreateUserModal from '../../components/admin/CreateUserModal';
import EditUserModal from '../../components/admin/EditUserModal';
import axios from 'axios';

export default function UserControlPage() {
  const navigate = useNavigate();
  const { user, logout, token } = useAuthStore();
  
  // State
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'verified' | 'unverified'>('verified');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Filters
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedKabupaten, setSelectedKabupaten] = useState('');
  const [kabupatens, setKabupatens] = useState<{id: number, nama: string}[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchKabupatens();
  }, [token]);

  const fetchKabupatens = () => {
    axios.get('http://127.0.0.1:8000/api/admin/kabupatens', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setKabupatens(res.data))
    .catch(err => console.error(err));
  };

  const fetchUsers = () => {
    setLoading(true);
    axios.get('http://127.0.0.1:8000/api/admin/users', {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => setUsers(res.data))
    .catch(err => console.error('Error fetching users:', err))
    .finally(() => setLoading(false));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };



  // Filter users based on active tab and search query
  const filteredUsers = users.filter(u => {
    const matchesTab = activeTab === 'verified' ? (u.is_active || u.is_active === 1) : (!u.is_active || u.is_active === 0);
    const searchLower = searchQuery.toLowerCase();
    
    // Resolve kabupaten display text for searching
    let kabText = u.kabupaten_nama;
    if (u.role === 'super_admin' || u.role === 'admin_prov') {
      kabText = 'Provinsi Sulawesi Selatan';
    }

    // Resolve role display text for searching
    let roleText = u.role;
    if (u.role === 'super_admin') roleText = 'Super Admin';
    else if (u.role === 'admin_prov') roleText = 'Admin Provinsi';
    else if (u.role === 'admin_kab') roleText = 'Admin Kabupaten';
    else if (u.role === 'pegawai') roleText = 'Pegawai';

    const matchesSearch = 
      (u.name && u.name.toLowerCase().includes(searchLower)) || 
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      (kabText && kabText.toLowerCase().includes(searchLower)) ||
      (roleText && roleText.toLowerCase().includes(searchLower));
      
    const matchesRole = selectedRole === '' || u.role === selectedRole;
    
    // Kabupaten filtering logic
    let matchesKabupaten = true;
    if (selectedKabupaten !== '') {
      // If filtering by "Provinsi" (we'll use 'provinsi' as the value)
      if (selectedKabupaten === 'provinsi') {
        matchesKabupaten = u.role === 'super_admin' || u.role === 'admin_prov';
      } else {
        matchesKabupaten = u.assigned_kabupaten_id?.toString() === selectedKabupaten;
      }
    }
    
    return matchesTab && matchesSearch && matchesRole && matchesKabupaten;
  }).sort((a, b) => {
    // Define role priority: Super Admin > Admin Provinsi > Admin Kabupaten > Pegawai
    const roleOrder: Record<string, number> = {
      'super_admin': 1,
      'admin_prov': 2,
      'admin_kab': 3,
      'pegawai': 4
    };
    
    const roleA = roleOrder[a.role] || 99;
    const roleB = roleOrder[b.role] || 99;
    
    // Sort by role first
    if (roleA !== roleB) {
      return roleA - roleB;
    }
    
    // If roles are equal, sort by name alphabetically
    const nameA = (a.name || '').toLowerCase();
    const nameB = (b.name || '').toLowerCase();
    return nameA.localeCompare(nameB);
  });

  // Pagination logic
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRole, selectedKabupaten, activeTab]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getRoleBadge = (role: string) => {
    switch(role) {
      case 'super_admin': return <span className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-200 rounded-full text-xs font-bold">Super Admin</span>;
      case 'admin_prov': return <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-full text-xs font-bold">Admin Provinsi</span>;
      case 'admin_kab': return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 border border-blue-200 rounded-full text-xs font-bold">Admin Kab</span>;
      case 'pegawai': return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold">Pegawai</span>;
      default: return <span className="px-2.5 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-bold">{role}</span>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    return d.toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
              <Link to="/admin/podes" className="px-4 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg font-medium text-sm transition-colors flex items-center gap-2">
                Data Podes
              </Link>
              {user?.role === 'super_admin' && (
                <Link to="/admin/users" className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-semibold text-sm transition-colors flex items-center gap-2">
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
              <Shield className="text-indigo-600" /> User Control (SuperAdmin)
            </h2>
            <p className="text-sm text-slate-500 mt-1">Kelola data seluruh pengguna platform, atur akses role, dan verifikasi akun baru.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-md shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"
            >
              <UserPlus size={18} /> Buat Akun Baru
            </button>
          </div>
        </div>

        {/* Tabs & Search */}
        <div className="bg-white p-2 rounded-t-2xl shadow-sm border border-slate-200 border-b-0 flex flex-col md:flex-row gap-4 justify-between items-center relative z-10">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto">
            <button
              onClick={() => setActiveTab('verified')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'verified' 
                  ? 'bg-white text-indigo-700 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Aktif / Diverifikasi
              </div>
            </button>
            <button
              onClick={() => setActiveTab('unverified')}
              className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'unverified' 
                  ? 'bg-white text-orange-600 shadow-sm' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Clock size={16} /> Belum Diverifikasi
                {users.filter(u => !u.is_active).length > 0 && (
                  <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-md text-[10px] ml-1">
                    {users.filter(u => !u.is_active).length}
                  </span>
                )}
              </div>
            </button>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            
            {/* Filter Role */}
            <div className="relative w-full md:w-40">
              <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <select 
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full appearance-none pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner"
              >
                <option value="">Semua Role</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin_prov">Admin Provinsi</option>
                <option value="admin_kab">Admin Kabupaten</option>
                <option value="pegawai">Pegawai</option>
              </select>
            </div>

            {/* Filter Kabupaten */}
            <div className="relative w-full md:w-48">
              <select 
                value={selectedKabupaten}
                onChange={(e) => setSelectedKabupaten(e.target.value)}
                className="w-full appearance-none px-4 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-inner"
              >
                <option value="">Semua Wilayah</option>
                <option value="provinsi">Provinsi Sulsel (Admin)</option>
                {kabupatens.map(k => (
                  <option key={k.id} value={k.id.toString()}>{k.nama}</option>
                ))}
              </select>
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Cari nama, role, wilayah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-b-2xl shadow-sm border border-slate-200 overflow-hidden h-[calc(100vh-280px)] min-h-[400px] flex flex-col relative">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}
          <div className="overflow-auto flex-1">
            <table className="w-full text-left text-sm table-fixed min-w-[1000px]">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-xs uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 w-[25%] whitespace-nowrap bg-slate-50">Pengguna</th>
                  <th className="px-6 py-4 w-[15%] whitespace-nowrap bg-slate-50">No Telp</th>
                  <th className="px-6 py-4 w-[15%] whitespace-nowrap bg-slate-50">Role</th>
                  <th className="px-6 py-4 w-[15%] whitespace-nowrap bg-slate-50">Kab/Kota</th>
                  <th className="px-6 py-4 w-[10%] text-center whitespace-nowrap bg-slate-50">Status</th>
                  <th className="px-6 py-4 w-[12%] whitespace-nowrap bg-slate-50">Last Login</th>
                  <th className="px-6 py-4 w-[8%] text-center whitespace-nowrap bg-slate-50">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {paginatedUsers.length > 0 ? paginatedUsers.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200">
                          {item.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{item.name}</p>
                          <p className="text-xs text-slate-500">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm text-slate-600 whitespace-nowrap">{item.no_telp || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{getRoleBadge(item.role)}</td>
                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {item.role === 'super_admin' || item.role === 'admin_prov' 
                        ? 'Provinsi Sulawesi Selatan' 
                        : (item.kabupaten_nama || '-')}
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      {(item.is_online || item.is_online === 1) ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-bold">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          Online
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">
                          <div className="w-2 h-2 rounded-full bg-slate-400"></div>
                          Offline
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500 whitespace-nowrap">{formatDate(item.last_login_at)}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">

                        <button 
                          onClick={() => setEditingUser(item)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors" 
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      <div className="flex flex-col items-center justify-center">
                        <XCircle size={32} className="text-slate-300 mb-3" />
                        <p className="font-semibold text-slate-700">Tidak ada pengguna ditemukan</p>
                        <p className="text-sm mt-1">Coba sesuaikan kata kunci pencarian atau ganti tab.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="bg-slate-50 border-t border-slate-200 p-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Menampilkan <span className="font-bold text-slate-700">{filteredUsers.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> hingga <span className="font-bold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> dari <span className="font-bold text-slate-700">{filteredUsers.length}</span> pengguna
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1 || filteredUsers.length === 0}
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

      <CreateUserModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={() => fetchUsers()}
      />
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        onSuccess={() => {
          fetchUsers();
          setEditingUser(null);
        }}
        user={editingUser}
      />
    </div>
  );
}
