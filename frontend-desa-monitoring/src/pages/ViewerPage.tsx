import { useRef, useEffect, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { ArrowLeft, Search, Filter, X, Activity, LogOut, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function ViewerPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [selectedDesa, setSelectedDesa] = useState<any>(null);
  const [webGLSupported, setWebGLSupported] = useState(true);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // New states for interactvity
  const [allDesas, setAllDesas] = useState<any[]>([]);
  const [kabupatens, setKabupatens] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedKabupaten, setSelectedKabupaten] = useState('');
  const [activeStatuses, setActiveStatuses] = useState<string[]>(['Mandiri', 'Maju', 'Berkembang', 'Tertinggal', 'Belum di data']);
  const [statusLabels, setStatusLabels] = useState<Record<string, string>>({
    'Mandiri': 'Mandiri ()',
    'Maju': 'Maju ()',
    'Berkembang': 'Berkembang ()',
    'Tertinggal': 'Tertinggal ()',
    'Belum di data': 'Belum di data'
  });

  // Calculate total active regions based on filters
  const activeDesaCount = useMemo(() => {
    return allDesas.filter(f => {
      const status = f.properties.status_kesulitan || 'Belum di data';
      const kab = f.properties.nama_kabupaten;
      const matchStatus = activeStatuses.length > 0 ? activeStatuses.includes(status) : false;
      const matchKab = selectedKabupaten ? kab === selectedKabupaten : true;
      return matchStatus && matchKab;
    }).length;
  }, [allDesas, activeStatuses, selectedKabupaten]);

  // Fetch GeoJSON once for search and kabupatens extraction
  useEffect(() => {
    fetch('http://127.0.0.1:8000/api/peta/desa')
      .then(res => res.json())
      .then(data => {
        if (data.features) {
          setAllDesas(data.features);
          const kabs = Array.from(new Set(data.features.map((f: any) => f.properties.nama_kabupaten).filter(Boolean))) as string[];
          setKabupatens(kabs.sort());

          // Extract dynamic status labels from kategori_indeks_desa
          const newLabels: Record<string, string> = {
            'Mandiri': 'Mandiri',
            'Maju': 'Maju',
            'Berkembang': 'Berkembang',
            'Tertinggal': 'Tertinggal',
            'Belum di data': 'Belum di data'
          };

          data.features.forEach((f: any) => {
            const kat = f.properties.kategori_indeks_desa;
            const status = f.properties.status_kesulitan;
            if (kat && status && status !== 'Belum di data') {
              // Keep the longest string (most descriptive)
              if (kat.length > newLabels[status].length) {
                newLabels[status] = kat;
              }
            }
          });

          setStatusLabels(prev => ({ ...prev, ...newLabels }));
        }
      })
      .catch(err => console.error("Error fetching desas for search:", err));
  }, []);

  // Update map filter when status or kabupaten changes
  useEffect(() => {
    if (!map.current || !map.current.getStyle()) return;

    // Sometimes map style isn't fully loaded yet when states change. 
    // We wrap it in a safe check or use map.on('idle') if needed.
    const updateStyle = () => {
      try {
        if (!map.current!.getLayer('desa-fill')) return;

        // Correct MapLibre expression: match is the safest and fastest way to check arrays
        const isStatusMatch = activeStatuses.length > 0
          ? ['match', ['get', 'status_kesulitan'], activeStatuses, true, false]
          : false;

        const isMatch = selectedKabupaten
          ? ['all', isStatusMatch, ['==', ['get', 'nama_kabupaten'], selectedKabupaten]]
          : isStatusMatch;

        // Use paint properties instead of filter so unselected areas become dimmed/gray instead of disappearing
        map.current!.setPaintProperty('desa-fill', 'fill-color', [
          'case',
          isMatch, ['coalesce', ['get', 'color'], '#94a3b8'],
          '#64748b' // Darker gray for unmatched to be clearly visible as inactive
        ]);

        map.current!.setPaintProperty('desa-fill', 'fill-opacity', [
          'case',
          ['boolean', ['feature-state', 'hover'], false], 0.9, // hover opacity
          isMatch, 0.75, // normal opacity for matched
          0.1  // very dimmed opacity for unmatched
        ]);

        map.current!.setPaintProperty('desa-line', 'line-opacity', [
          'case',
          isMatch, 0.5,
          0.05
        ]);

        // Remove filters so all polygons render
        map.current!.setFilter('desa-fill', null);
        map.current!.setFilter('desa-line', null);

      } catch (e) {
        // layer not ready
      }
    };

    updateStyle();
    // also attach to style.load or idle just in case
    map.current.on('idle', updateStyle);
    return () => {
      map.current?.off('idle', updateStyle);
    };
  }, [activeStatuses, selectedKabupaten]);

  // Handle Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const term = searchQuery.toLowerCase();
    const results = allDesas.filter(f =>
      f.properties.nama_desa_kelurahan?.toLowerCase().includes(term) ||
      f.properties.nama_kecamatan?.toLowerCase().includes(term)
    ).slice(0, 10); // limit to 10 results
    setSearchResults(results);
  }, [searchQuery, allDesas]);

  const handleSelectSearch = (feature: any) => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearchFocused(false);

    const props = feature.properties;
    setSelectedDesa({
      ...props,
      statusLabel: props.kategori_indeks_desa || statusLabels[props.status_kesulitan] || 'Belum di data',
      statusColor: props.status_kesulitan === 'Mandiri' ? 'bg-blue-500' :
        props.status_kesulitan === 'Maju' ? 'bg-green-500' :
          props.status_kesulitan === 'Berkembang' ? 'bg-yellow-500' :
            props.status_kesulitan === 'Tertinggal' ? 'bg-red-500' : 'bg-slate-500'
    });

    // Fly to location if we have coordinates
    if (props.longitude && props.latitude) {
      map.current?.flyTo({
        center: [props.longitude, props.latitude],
        zoom: 13,
        speed: 1.5,
        essential: true
      });
    }
  };

  const handleStatusToggle = (status: string) => {
    setActiveStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  useEffect(() => {
    if (!webGLSupported) return;
    if (map.current) return;

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: {
          version: 8,
          glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
          sources: {
            'satellite': {
              type: 'raster',
              tiles: [
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              ],
              tileSize: 256,
              attribution: 'Tiles &copy; Esri'
            },
            'terrain-source': {
              type: 'raster-dem',
              tiles: [
                'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
              ],
              encoding: 'terrarium',
              tileSize: 256,
              maxzoom: 14
            }
          },
          terrain: {
            source: 'terrain-source',
            exaggeration: 1.5 // Memberikan efek gunung yang lebih menonjol
          },
          layers: [
            {
              id: 'satellite-layer',
              type: 'raster',
              source: 'satellite',
              minzoom: 0,
              maxzoom: 22
            }
          ]
        },
        center: [120.0, -3.2], // Bergeser sedikit agar pegunungan Enrekang/Toraja terlihat jelas
        zoom: 7,
        pitch: 65, // Memiringkan kamera 65 derajat untuk efek 3D
        bearing: -20, // Memutar kamera sedikit
        maxPitch: 85,
        maxBounds: [
          [116.0, -8.0], // Southwest
          [125.0, 1.0]   // Northeast bounds locking to Sulawesi
        ]
      });
    } catch (error) {
      console.warn("Failed to initialize map (WebGL might not be supported):", error);
      setWebGLSupported(false);
      return;
    }

    map.current.on('load', () => {
      // Add Sulsel API GeoJSON
      map.current!.addSource('desa', {
        type: 'geojson',
        data: 'http://127.0.0.1:8000/api/peta/desa',
        generateId: true
      });

      // Use real DB status
      map.current!.addLayer({
        id: 'desa-fill',
        type: 'fill',
        source: 'desa',
        paint: {
          'fill-color': ['coalesce', ['get', 'color'], '#94a3b8'],
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            0.8,
            0.5
          ]
        }
      });

      map.current!.addLayer({
        id: 'desa-line',
        type: 'line',
        source: 'desa',
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            2,
            0.5
          ],
          'line-opacity': 0.7
        }
      });

      // Layer untuk menampilkan teks nama desa di titik pusatnya
      map.current!.addLayer({
        id: 'desa-label',
        type: 'symbol',
        source: 'desa',
        minzoom: 11,
        layout: {
          'text-field': ['get', 'nama_desa_kelurahan'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            11, 10,
            14, 14
          ],
          'text-transform': 'uppercase',
          'text-max-width': 10
        },
        paint: {
          'text-color': '#475569', // slate-600
          'text-halo-color': '#ffffff',
          'text-halo-width': 2
        }
      });

      // Add API GeoJSON for hierarchy labels (Provinsi, Kabupaten, Kecamatan)
      map.current!.addSource('labels', {
        type: 'geojson',
        data: 'http://127.0.0.1:8000/api/peta/labels'
      });

      // Provinsi Label
      map.current!.addLayer({
        id: 'provinsi-label',
        type: 'symbol',
        source: 'labels',
        maxzoom: 7,
        filter: ['==', ['get', 'level'], 'provinsi'],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            0, 14,
            6, 24
          ],
          'text-transform': 'uppercase',
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
          'text-letter-spacing': 0.1
        },
        paint: {
          'text-color': '#0f172a', // slate-900
          'text-halo-color': '#ffffff',
          'text-halo-width': 3
        }
      });

      // Kabupaten Label
      map.current!.addLayer({
        id: 'kabupaten-label',
        type: 'symbol',
        source: 'labels',
        minzoom: 6,
        maxzoom: 9.5,
        filter: ['==', ['get', 'level'], 'kabupaten'],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            6, 12,
            9, 18
          ],
          'text-transform': 'uppercase',
          'text-font': ['Open Sans SemiBold', 'Arial Unicode MS Bold'],
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#1e293b', // slate-800
          'text-halo-color': '#f8fafc',
          'text-halo-width': 2
        }
      });

      // Kecamatan Label
      map.current!.addLayer({
        id: 'kecamatan-label',
        type: 'symbol',
        source: 'labels',
        minzoom: 9,
        maxzoom: 11.5,
        filter: ['==', ['get', 'level'], 'kecamatan'],
        layout: {
          'text-field': ['get', 'name'],
          'text-size': [
            'interpolate', ['linear'], ['zoom'],
            9, 10,
            11, 14
          ],
          'text-transform': 'uppercase'
        },
        paint: {
          'text-color': '#334155', // slate-700
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5
        }
      });

      let hoveredStateId: string | number | null = null;

      map.current!.on('mousemove', 'desa-fill', (e) => {
        if (e.features && e.features.length > 0) {
          if (hoveredStateId !== null) {
            map.current!.setFeatureState(
              { source: 'desa', id: hoveredStateId },
              { hover: false }
            );
          }
          hoveredStateId = e.features[0].id as string | number;
          map.current!.setFeatureState(
            { source: 'desa', id: hoveredStateId },
            { hover: true }
          );

          map.current!.getCanvas().style.cursor = 'pointer';
        }
      });

      map.current!.on('mouseleave', 'desa-fill', () => {
        if (hoveredStateId !== null) {
          map.current!.setFeatureState(
            { source: 'desa', id: hoveredStateId },
            { hover: false }
          );
        }
        hoveredStateId = null;
        map.current!.getCanvas().style.cursor = '';
      });

      map.current!.on('click', 'desa-fill', (e) => {
        if (e.features && e.features.length > 0) {
          const props = e.features[0].properties;

          setSelectedDesa({
            ...props,
            statusLabel: props.kategori_indeks_desa || statusLabels[props.status_kesulitan] || 'Belum di data',
            statusColor: props.status_kesulitan === 'Maju' ? 'bg-green-500' :
              props.status_kesulitan === 'Berkembang' ? 'bg-yellow-500' :
                props.status_kesulitan === 'Tertinggal' ? 'bg-red-500' : 'bg-slate-500'
          });

          // Zoom to clicked polygon roughly
          map.current!.flyTo({
            center: e.lngLat,
            zoom: 11,
            speed: 1.2
          });
        }
      });
    });

  }, []);


  return (
    <div className="fixed inset-0 flex overflow-hidden bg-slate-100 font-sans text-slate-800">
      {/* Sidebar Kiri: Filter Panel */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col z-10 shadow-xl relative">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-4">
            <Link to="/" className="p-2 hover:bg-white rounded-full shadow-sm border border-slate-200 transition-all hover:-translate-x-1">
              <ArrowLeft size={18} className="text-slate-600" />
            </Link>
            <div>
              <h1 className="font-bold text-lg text-slate-800 leading-tight">DesaMonitor</h1>
              <p className="text-xs text-brand-500 font-medium">Peta Interaktif Viewer</p>
            </div>
          </div>
          <Link to="/viewer/settings" className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors group" title="Account Settings">
            <Settings size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </Link>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Wilayah</label>
            <div className="space-y-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Cari desa/kecamatan..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-all shadow-inner"
                />

                {/* Autocomplete Dropdown */}
                {isSearchFocused && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                    {searchResults.map((res: any) => (
                      <div
                        key={res.properties.id}
                        onClick={() => handleSelectSearch(res)}
                        className="px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                      >
                        <p className="text-sm font-bold text-slate-800">{res.properties.nama_desa_kelurahan || 'Desa'}</p>
                        <p className="text-xs text-slate-500">{res.properties.nama_kecamatan} &bull; {res.properties.nama_kabupaten}</p>
                      </div>
                    ))}
                  </div>
                )}
                {isSearchFocused && searchQuery && searchResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-4 text-center">
                    <p className="text-sm text-slate-500">Tidak ditemukan</p>
                  </div>
                )}
              </div>

              <select
                value={selectedKabupaten}
                onChange={(e) => setSelectedKabupaten(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-700"
              >
                <option value="">Semua Kabupaten/Kota</option>
                {kabupatens.map(kab => (
                  <option key={kab} value={kab}>{kab}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="border-slate-100 mb-6" />

          {/* TOTAL WILAYAH AKTIF */}
          <div className="mb-6">
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Total Wilayah Aktif</p>
                <p className="text-3xl font-black text-indigo-700 leading-none">{activeDesaCount.toLocaleString('id-ID')}</p>
                <p className="text-xs text-indigo-400 mt-1">Desa/Kelurahan</p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
                <Activity size={24} />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Filter size={14} /> Filter Status
            </label>
            <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
              {[
                { value: 'Mandiri', label: statusLabels['Mandiri'], color: 'bg-blue-500' },
                { value: 'Maju', label: statusLabels['Maju'], color: 'bg-green-500' },
                { value: 'Berkembang', label: statusLabels['Berkembang'], color: 'bg-yellow-500' },
                { value: 'Tertinggal', label: statusLabels['Tertinggal'], color: 'bg-red-500' },
                { value: 'Belum di data', label: statusLabels['Belum di data'], color: 'bg-slate-400' }
              ].map((item) => (
                <div key={item.value} className="flex items-center justify-between group">
                  <label className="flex items-center gap-3 cursor-pointer w-full">
                    <input
                      type="checkbox"
                      checked={activeStatuses.includes(item.value)}
                      onChange={() => handleStatusToggle(item.value)}
                      className="rounded border-slate-300 text-brand-500 focus:ring-brand-500 h-4 w-4 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">{item.label}</span>
                  </label>
                  <div className={`w-3 h-3 rounded-full ${item.color} shadow-sm`}></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Section (Bottom of Sidebar) */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 mt-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold shrink-0 overflow-hidden">
                {user?.profile_photo_url ? (
                  <img src={user.profile_photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  (user?.name || 'U').charAt(0).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-slate-800 truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-500 truncate" title={user?.email}>
                  {(user?.email && user.email.length > 20) ? user.email.substring(0, 10) + '...' + user.email.substring(user.email.indexOf('@')) : user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>

          {(user?.role === 'super_admin' || user?.role === 'admin') && (
            <Link
              to="/admin"
              className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              <Settings size={14} />
              Ke Halaman Admin
            </Link>
          )}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        {!webGLSupported ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 p-8 text-center z-10">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md border border-slate-200">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">WebGL Tidak Didukung</h2>
              <p className="text-sm text-slate-600 mb-6">
                Lingkungan atau browser Anda saat ini tidak mendukung WebGL yang diperlukan untuk merender Peta Interaktif. Jika Anda membuka ini di dalam editor, silakan buka aplikasi di browser eksternal (seperti Chrome, Edge, atau Firefox).
              </p>
              <a href="http://localhost:5173/viewer" target="_blank" rel="noopener noreferrer" className="inline-block px-6 py-3 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-brand-500/30">
                Buka di Browser Eksternal
              </a>
            </div>
          </div>
        ) : (
          <div ref={mapContainer} className="absolute inset-0" style={{ width: '100%', height: '100%', minHeight: '400px' }} />
        )}

        {/* Map Legend */}
        {webGLSupported && (
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/20 z-10 pointer-events-none">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Legenda Status</h4>
            <div className="flex gap-4">
              {[
                { label: statusLabels['Mandiri'], color: 'bg-blue-500' },
                { label: statusLabels['Maju'], color: 'bg-green-500' },
                { label: statusLabels['Berkembang'], color: 'bg-yellow-500' },
                { label: statusLabels['Tertinggal'], color: 'bg-red-500' },
                { label: statusLabels['Belum di data'], color: 'bg-slate-400' }
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full shadow-sm ${item.color}`}></span>
                  <span className="text-xs font-bold text-slate-700">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sidebar Kanan: Detail Panel */}
      <div className={`w-96 bg-white border-l border-slate-200 flex flex-col z-20 shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] absolute right-0 top-0 bottom-0 ${selectedDesa ? 'translate-x-0' : 'translate-x-full'}`}>
        {selectedDesa && (
          <>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="font-bold text-slate-800 flex items-center gap-2"><Activity size={18} className="text-brand-500" /> Detail Wilayah</h2>
              <button onClick={() => setSelectedDesa(null)} className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="mb-8">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white mb-4 shadow-sm ${selectedDesa.statusColor}`}>
                  Status: {selectedDesa.statusLabel}
                </div>
                <h3 className="text-3xl font-extrabold text-slate-900 mb-2 leading-tight">{selectedDesa.nama_desa_kelurahan || selectedDesa.NAMOBJ || 'Nama Desa'}</h3>
                <p className="text-sm font-medium text-slate-500 bg-slate-100 inline-block px-3 py-1 rounded-lg">
                  {selectedDesa.nama_kecamatan || 'Kecamatan'} &bull; {selectedDesa.nama_kabupaten || 'Kabupaten'}
                </p>
                {selectedDesa.latitude && selectedDesa.longitude && (
                  <p className="text-xs font-mono text-slate-400 mt-2 flex items-center gap-1">
                    📍 {selectedDesa.latitude.toFixed(5)}, {selectedDesa.longitude.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                  <h4 className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <Activity size={16} className="text-brand-500" /> Metrik IKG
                  </h4>
                  <div className="grid grid-cols-2 gap-4 my-3">
                    <div>
                      <p className="text-xs text-slate-500">Skor IKG</p>
                      <p className="font-bold text-slate-800">{selectedDesa.ikg !== null && selectedDesa.ikg !== undefined ? parseFloat(Number(selectedDesa.ikg).toFixed(4)) : '-'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Indeks Desa</p>
                      <p className="font-bold text-slate-800">{selectedDesa.indeks_desa !== null && selectedDesa.indeks_desa !== undefined ? parseFloat(Number(selectedDesa.indeks_desa).toFixed(4)) : '-'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Kategori Status</p>
                      <p className="font-bold text-slate-800">{selectedDesa.statusLabel || '-'}</p>
                    </div>
                  </div>
                  <hr className="my-3 border-slate-200" />
                  <p className="text-sm text-slate-600 leading-relaxed font-medium">
                    Pelayanan Dasar: {selectedDesa.pelayanan_dasar !== null && selectedDesa.pelayanan_dasar !== undefined ? parseFloat(Number(selectedDesa.pelayanan_dasar).toFixed(4)) : '-'} <br />
                    Infrastruktur: {selectedDesa.infrastruktur !== null && selectedDesa.infrastruktur !== undefined ? parseFloat(Number(selectedDesa.infrastruktur).toFixed(4)) : '-'} <br />
                    Aksesibilitas: {selectedDesa.aksesbilitas !== null && selectedDesa.aksesbilitas !== undefined ? parseFloat(Number(selectedDesa.aksesbilitas).toFixed(4)) : '-'}
                  </p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-3">Kantor kepala desa</h4>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="aspect-[16/9] bg-slate-200 rounded-xl flex items-center justify-center text-slate-400 text-xs shadow-inner overflow-hidden relative group cursor-pointer">
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors z-10"></div>
                      {selectedDesa.foto_kantor ? (
                        <img src={`http://127.0.0.1:8000${selectedDesa.foto_kantor}`} alt="Kantor Kepala Desa" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-medium text-slate-500">Gambar belum ada</span>
                      )}
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </>
        )}
      </div>



    </div>
  );
}
