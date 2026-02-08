import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
// Import library html5-qrcode (Ganti jsQR)
import { Html5Qrcode } from 'html5-qrcode';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [kunjungan, setKunjungan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  const [filterSesi, setFilterSesi] = useState('Semua');
  const [stats, setStats] = useState({ total: 0, pending: 0, selesai: 0, users: 0 });
  const [selectedPeriod, setSelectedPeriod] = useState('day');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [detailView, setDetailView] = useState(null);
  const [detailPage, setDetailPage] = useState(1);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [scanResult, setScanResult] = useState('');
  
  // Ref untuk instance scanner (Ganti videoRef, canvasRef, streamRef)
  const html5QrCodeRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const { data: userData, error: uError } = await supabase.from('users').select('*').order('created_at', { ascending: false });
      const { data: kunjunganData, error: kError } = await supabase.from('kunjungan').select('*').order('created_at', { ascending: false });

      if (uError) {
        console.error("User fetch error:", uError.message);
        setUsers([]);
      } else {
        setUsers(userData || []);
      }

      if (kError) {
        console.error("Kunjungan fetch error:", kError.message);
        setKunjungan([]);
      } else {
        setKunjungan(kunjunganData || []);
      }
      
      const today = new Date().toISOString().split('T')[0];
      setStats({
        total: (kunjunganData || []).filter(k => k.tanggal === today).length,
        pending: (kunjunganData || []).filter(k => k.status === 'pending').length,
        selesai: (kunjunganData || []).filter(k => k.status === 'selesai').length,
        users: (userData || []).filter(u => !u.is_approved).length
      });
    } catch (err) {
      console.error("Fetch Error:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if(!window.confirm("Setujui akun ini?")) return;
    
    try {
      const { error } = await supabase
        .from('users')
        .update({ is_approved: true })
        .eq('id', id);
      
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === id ? { ...u, is_approved: true } : u));
      setStats(prev => ({ ...prev, users: Math.max(0, prev.users - 1) }));
      
    } catch (error) {
      console.error("Approve error:", error);
      alert("Gagal update: " + error.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if(!window.confirm("Hapus akun ini secara PERMANEN?")) return;
    
    try {
      const deletedUser = users.find(u => u.id === id);
      setUsers(prev => prev.filter(u => u.id !== id));
      
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      if (deletedUser && !deletedUser.is_approved) {
        setStats(prev => ({ ...prev, users: Math.max(0, prev.users - 1) }));
      }
      
      console.log(`User ${id} berhasil dihapus`);
      
    } catch (error) {
      console.error("Delete user error:", error);
      alert("Gagal menghapus user: " + error.message);
      await fetchData();
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('kunjungan')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      setKunjungan(prev => prev.map(k => k.id === id ? { ...k, status: newStatus } : k));
      
      if (newStatus === 'selesai') {
        setStats(prev => ({
          ...prev,
          pending: Math.max(0, prev.pending - 1),
          selesai: prev.selesai + 1
        }));
      }
      
    } catch (error) {
      console.error("Update status error:", error);
      alert("Gagal update status: " + error.message);
    }
  };

  const handleDeleteTiket = async (id) => {
    if(!window.confirm("Hapus tiket ini secara permanen dari database?")) return;

    try {
      const deletedTiket = kunjungan.find(k => k.id === id);
      setKunjungan(prev => prev.filter(k => k.id !== id));

      const { error } = await supabase
        .from('kunjungan')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      const today = new Date().toISOString().split('T')[0];
      if (deletedTiket) {
        const updates = { ...stats };
        if (deletedTiket.tanggal === today) {
          updates.total = Math.max(0, updates.total - 1);
        }
        if (deletedTiket.status === 'pending') {
          updates.pending = Math.max(0, updates.pending - 1);
        }
        if (deletedTiket.status === 'selesai') {
          updates.selesai = Math.max(0, updates.selesai - 1);
        }
        setStats(updates);
      }
      
      console.log(`Tiket ${id} berhasil dihapus`);
      
    } catch (error) {
      console.error("Delete tiket error:", error);
      alert("Database menolak penghapusan: " + error.message);
      await fetchData();
    }
  };

  const filteredKunjungan = useMemo(() => {
    return kunjungan.filter(item => {
      const matchSearch = (item.nama_pengunjung || "").toLowerCase().includes(search.toLowerCase()) || 
                          (item.wbp || "").toLowerCase().includes(search.toLowerCase());
      const matchSesi = filterSesi === 'Semua' ? true : 
                        (filterSesi === 'Titipan' ? item.tipe === 'penitipan' : item.sesi === filterSesi);
      return matchSearch && matchSesi;
    });
  }, [kunjungan, search, filterSesi]);

  // Analytics data processing
  const analyticsData = useMemo(() => {
    const data = { day: {}, month: {}, year: {} };
    
    kunjungan.filter(k => k.status === 'selesai').forEach(k => {
      const date = new Date(k.tanggal);
      const dayKey = k.tanggal;
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const yearKey = `${date.getFullYear()}`;
      
      // Day stats
      if (!data.day[dayKey]) data.day[dayKey] = { kunjungan: 0, penitipan: 0, total: 0, wbpList: {} };
      if (k.tipe === 'penitipan') data.day[dayKey].penitipan++;
      else data.day[dayKey].kunjungan++;
      data.day[dayKey].total++;
      data.day[dayKey].wbpList[k.wbp] = (data.day[dayKey].wbpList[k.wbp] || 0) + 1;
      
      // Month stats
      if (!data.month[monthKey]) data.month[monthKey] = { kunjungan: 0, penitipan: 0, total: 0, wbpList: {} };
      if (k.tipe === 'penitipan') data.month[monthKey].penitipan++;
      else data.month[monthKey].kunjungan++;
      data.month[monthKey].total++;
      data.month[monthKey].wbpList[k.wbp] = (data.month[monthKey].wbpList[k.wbp] || 0) + 1;
      
      // Year stats
      if (!data.year[yearKey]) data.year[yearKey] = { kunjungan: 0, penitipan: 0, total: 0, wbpList: {} };
      if (k.tipe === 'penitipan') data.year[yearKey].penitipan++;
      else data.year[yearKey].kunjungan++;
      data.year[yearKey].total++;
      data.year[yearKey].wbpList[k.wbp] = (data.year[yearKey].wbpList[k.wbp] || 0) + 1;
    });
    
    return data;
  }, [kunjungan]);

  const currentPeriodData = useMemo(() => {
    const date = selectedDate;
    let key;
    
    if (selectedPeriod === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (selectedPeriod === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    } else {
      key = `${date.getFullYear()}`;
    }
    
    return analyticsData[selectedPeriod][key] || { kunjungan: 0, penitipan: 0, total: 0, wbpList: {} };
  }, [analyticsData, selectedPeriod, selectedDate]);

  const topWBP = useMemo(() => {
    const wbpList = currentPeriodData.wbpList || {};
    return Object.entries(wbpList)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [currentPeriodData]);

  const changePeriod = (direction) => {
    const newDate = new Date(selectedDate);
    if (selectedPeriod === 'day') {
      newDate.setDate(newDate.getDate() + direction);
    } else if (selectedPeriod === 'month') {
      newDate.setMonth(newDate.getMonth() + direction);
    } else {
      newDate.setFullYear(newDate.getFullYear() + direction);
    }
    setSelectedDate(newDate);
  };

  const formatPeriodDisplay = () => {
    if (selectedPeriod === 'day') {
      return selectedDate.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    } else if (selectedPeriod === 'month') {
      return selectedDate.toLocaleDateString('id-ID', { year: 'numeric', month: 'long' });
    } else {
      return selectedDate.getFullYear();
    }
  };

  const openDetailView = () => {
    let filteredData;
    const date = selectedDate;
    
    if (selectedPeriod === 'day') {
      const key = date.toISOString().split('T')[0];
      filteredData = kunjungan.filter(k => k.status === 'selesai' && k.tanggal === key);
    } else if (selectedPeriod === 'month') {
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      filteredData = kunjungan.filter(k => {
        if (k.status !== 'selesai') return false;
        const kDate = new Date(k.tanggal);
        const kKey = `${kDate.getFullYear()}-${String(kDate.getMonth() + 1).padStart(2, '0')}`;
        return kKey === monthKey;
      });
    } else {
      const yearKey = `${date.getFullYear()}`;
      filteredData = kunjungan.filter(k => {
        if (k.status !== 'selesai') return false;
        const kDate = new Date(k.tanggal);
        return kDate.getFullYear() === parseInt(yearKey);
      });
    }
    
    setDetailView(filteredData);
    setDetailPage(1);
  };

  const paginatedDetail = useMemo(() => {
    if (!detailView) return [];
    const start = (detailPage - 1) * 10;
    return detailView.slice(start, start + 10);
  }, [detailView, detailPage]);

  const totalPages = detailView ? Math.ceil(detailView.length / 10) : 0;

  // ============ QR SCANNER FUNCTIONS (UPDATED TO html5-qrcode) ============
  
  // Start Scanner menggunakan Html5Qrcode
  const startScanner = async () => {
    try {
      // Pastikan elemen reader sudah ada di DOM
      const readerElement = document.getElementById("reader");
      if (!readerElement) {
        console.error("Element 'reader' tidak ditemukan di DOM");
        return;
      }

      const scanner = new Html5Qrcode("reader");
      html5QrCodeRef.current = scanner;

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await scanner.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        (errorMessage) => {
          // Ini adalah error saat scanning (bukan error fatal)
          // Tidak perlu di-log karena akan sangat banyak
        }
      );
      
      console.log("Scanner berhasil dijalankan");
    } catch (err) {
      console.error("Gagal start scanner:", err);
      alert("Kamera tidak ditemukan atau izin ditolak. Error: " + err);
    }
  };

  // Handle Success - Detect QR Code
  const onScanSuccess = (decodedText) => {
    setScanResult(decodedText);
    
    // Matikan scanner setelah berhasil agar tidak berulang
    stopScanner();

    // Logika popup sesuai format URL
    const match = decodedText.match(/\/(verify|verify-item)\/([^\/\s]+)$/);
    if (match) {
      const id = match[2];
      const type = match[1];
      if (window.confirm('Tiket Terdeteksi!\nBuka link verifikasi ini?\n\n' + decodedText)) {
        window.open(type === 'verify-item' ? `/verify-item/${id}` : `/verify/${id}`, '_blank');
      }
    } else {
      alert("Hasil Scan: " + decodedText);
    }
  };

  // Stop Scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        const scannerState = await html5QrCodeRef.current.getState();
        // State 2 = SCANNING, State 3 = PAUSED
        if (scannerState === 2 || scannerState === 3) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.warn("Gagal stop scanner:", err);
      }
    }
    setShowQRScanner(false);
  };

  // Trigger start/stop saat modal scanner dibuka/tutup
  useEffect(() => {
    if (showQRScanner) {
      // Beri delay lebih lama agar elemen "reader" benar-benar muncul di DOM
      const timer = setTimeout(() => {
        startScanner();
      }, 500);
      
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    }
    // eslint-disable-next-line
  }, [showQRScanner]);

  // Handle Manual QR Input
  const handleManualQRInput = (input) => {
    const match = input.match(/\/(verify|verify-item)\/([^\/\s]+)$/);
    if (match) {
      const id = match[2];
      const type = match[1];
      window.open(type === 'verify-item' ? `/verify-item/${id}` : `/verify/${id}`, '_blank');
      stopScanner();
    } else {
      alert('Format QR Code tidak valid!');
    }
  };

  // ============ END OF QR SCANNER FUNCTIONS ============

  if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Memuat Data...</div>;

  // Detail View Page
  if (detailView) {
    const kunjunganCount = paginatedDetail.filter(d => d.tipe !== 'penitipan').length;
    const penitipanCount = paginatedDetail.filter(d => d.tipe === 'penitipan').length;
    
    return (
      <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
            <button onClick={() => setDetailView(null)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.3)', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', marginBottom: '15px', backdropFilter: 'blur(5px)' }}>
              ← Kembali ke Dashboard
            </button>
            <h1 style={{ margin: 0, color: 'white', fontSize: '24px', fontWeight: '800' }}>
              📋 Detail Laporan: {formatPeriodDisplay()}
            </h1>
            <p style={{ margin: '5px 0 0', color: '#bfdbfe' }}>Total {detailView.length} transaksi selesai</p>
          </div>
        </div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' }}>TOTAL LAYANAN</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#1e40af' }}>{detailView.length}</div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' }}>KUNJUNGAN</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#3b82f6' }}>{detailView.filter(d => d.tipe !== 'penitipan').length}</div>
            </div>
            <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' }}>PENITIPAN</div>
              <div style={{ fontSize: '28px', fontWeight: '800', color: '#10b981' }}>{detailView.filter(d => d.tipe === 'penitipan').length}</div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: '16px', padding: '20px' }}>
            <div style={{ display: 'grid', gap: '12px' }}>
              {paginatedDetail.map((item, idx) => (
                <div key={item.id} style={{ padding: '16px', borderRadius: '12px', background: '#f9fafb', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: item.tipe === 'penitipan' ? '#d1fae5' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '18px', color: item.tipe === 'penitipan' ? '#059669' : '#2563eb' }}>
                    {(detailPage - 1) * 10 + idx + 1}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#111827' }}>{item.nama_pengunjung} → {item.wbp}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '3px' }}>
                      {item.tipe === 'penitipan' ? '📦 Penitipan' : '👥 Kunjungan'} • {item.tanggal} • {item.sesi || 'Barang'}
                    </div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#10b981', fontWeight: '700', background: '#d1fae5', padding: '6px 12px', borderRadius: '8px' }}>
                    SELESAI
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                <button 
                  onClick={() => setDetailPage(p => Math.max(1, p - 1))}
                  disabled={detailPage === 1}
                  style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: detailPage === 1 ? '#f3f4f6' : 'white', cursor: detailPage === 1 ? 'not-allowed' : 'pointer', fontWeight: '600', color: detailPage === 1 ? '#9ca3af' : '#374151' }}
                >
                  ← Prev
                </button>
                
                <div style={{ display: 'flex', gap: '6px' }}>
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setDetailPage(i + 1)}
                      style={{ width: '40px', height: '40px', borderRadius: '10px', border: 'none', background: detailPage === i + 1 ? '#1e40af' : '#e5e7eb', color: detailPage === i + 1 ? 'white' : '#6b7280', fontWeight: '700', cursor: 'pointer' }}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setDetailPage(p => Math.min(totalPages, p + 1))}
                  disabled={detailPage === totalPages}
                  style={{ padding: '10px 16px', borderRadius: '10px', border: '1px solid #e5e7eb', background: detailPage === totalPages ? '#f3f4f6' : 'white', cursor: detailPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: '600', color: detailPage === totalPages ? '#9ca3af' : '#374151' }}
                >
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', padding: '20px 24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ fontSize: '30px' }}>🛡️</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'white', letterSpacing: '0.5px' }}>ADMIN SIPENA</h1>
              <p style={{ margin: 0, fontSize: '12px', color: '#bfdbfe', fontWeight: '500' }}>Lapas Kelas IIA Kerobokan</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setShowQRScanner(true)} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', backdropFilter: 'blur(5px)' }}>
              📷 Scan QR
            </button>
            <button onClick={() => { localStorage.clear(); navigate('/login'); }} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', padding: '10px 20px', borderRadius: '10px', fontWeight: '600', cursor: 'pointer', fontSize: '13px', transition: '0.2s', backdropFilter: 'blur(5px)' }} onMouseOver={e => e.target.style.background = '#ef4444'} onMouseOut={e => e.target.style.background = 'rgba(255,255,255,0.1)'}>
              Log Out
            </button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        
        {/* Tabs Navigation */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '30px', background: '#e5e7eb', padding: '6px', borderRadius: '14px', width: 'fit-content', flexWrap: 'wrap' }}>
          <TabButton active={tab === 'dashboard'} onClick={() => setTab('dashboard')} icon="📊" label="Dashboard" />
          <TabButton active={tab === 'analytics'} onClick={() => setTab('analytics')} icon="📈" label="Analytics" />
          <TabButton active={tab === 'verifikasi'} onClick={() => setTab('verifikasi')} icon="👥" label={`User ${stats.users > 0 ? `(${stats.users})` : ''}`} />
          <TabButton active={tab === 'monitoring'} onClick={() => setTab('monitoring')} icon="🎫" label="Monitoring Tiket" />
        </div>

        {/* Dashboard Tab */}
        {tab === 'dashboard' && (
          <div className="fade-in">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <StatCard title="Antrean Hari Ini" value={stats.total} icon="📋" color="#3b82f6" />
              <StatCard title="Menunggu Verifikasi" value={stats.pending} icon="⏳" color="#f59e0b" />
              <StatCard title="Selesai Dilayani" value={stats.selesai} icon="✅" color="#10b981" />
              <StatCard title="User Baru" value={stats.users} icon="👤" color="#8b5cf6" />
            </div>

            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '700', color: '#1f2937', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span>⚡</span> Aktivitas Pendaftaran Terakhir
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {kunjungan.slice(0, 8).map(k => (
                  <div key={k.id} style={{ padding: '14px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: k.tipe === 'penitipan' ? '#10b981' : '#3b82f6' }}></div>
                    <div style={{ flex: 1, fontSize: '14px' }}>
                      <strong style={{ color: '#374151' }}>{k.nama_pengunjung}</strong> 
                      <span style={{ color: '#6b7280' }}> mendaftar {k.tipe === 'penitipan' ? 'penitipan' : 'kunjungan'} untuk </span>
                      <strong style={{ color: '#374151' }}>{k.wbp}</strong>
                    </div>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>{new Date(k.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {tab === 'analytics' && (
          <div className="fade-in">
            {/* Period Selector */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => setSelectedPeriod('day')}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: selectedPeriod === 'day' ? 'none' : '1px solid #e5e7eb', background: selectedPeriod === 'day' ? '#1e40af' : 'white', color: selectedPeriod === 'day' ? 'white' : '#6b7280', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Per Hari
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('month')}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: selectedPeriod === 'month' ? 'none' : '1px solid #e5e7eb', background: selectedPeriod === 'month' ? '#1e40af' : 'white', color: selectedPeriod === 'month' ? 'white' : '#6b7280', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Per Bulan
                  </button>
                  <button 
                    onClick={() => setSelectedPeriod('year')}
                    style={{ padding: '10px 18px', borderRadius: '10px', border: selectedPeriod === 'year' ? 'none' : '1px solid #e5e7eb', background: selectedPeriod === 'year' ? '#1e40af' : 'white', color: selectedPeriod === 'year' ? 'white' : '#6b7280', fontWeight: '700', cursor: 'pointer', fontSize: '13px' }}
                  >
                    Per Tahun
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button onClick={() => changePeriod(-1)} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>←</button>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1e40af', minWidth: '250px', textAlign: 'center' }}>
                    {formatPeriodDisplay()}
                  </div>
                  <button onClick={() => changePeriod(1)} style={{ width: '40px', height: '40px', borderRadius: '10px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}>→</button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '20px' }}>
              <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' }}>TOTAL LAYANAN</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e40af' }}>{currentPeriodData.total}</div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' }}>KUNJUNGAN</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#3b82f6' }}>{currentPeriodData.kunjungan}</div>
              </div>
              <div style={{ background: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e5e7eb' }}>
                <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', marginBottom: '5px' }}>PENITIPAN</div>
                <div style={{ fontSize: '32px', fontWeight: '800', color: '#10b981' }}>{currentPeriodData.penitipan}</div>
              </div>
            </div>

            {/* Chart Visualization */}
            <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>📊 Grafik Layanan</h3>
              <div style={{ display: 'flex', gap: '10px', height: '200px', alignItems: 'flex-end' }}>
                {currentPeriodData.kunjungan > 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', background: 'linear-gradient(180deg, #3b82f6 0%, #2563eb 100%)', borderRadius: '10px 10px 0 0', height: `${(currentPeriodData.kunjungan / currentPeriodData.total) * 100}%`, minHeight: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px' }}>
                      {currentPeriodData.kunjungan}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Kunjungan</div>
                  </div>
                )}
                {currentPeriodData.penitipan > 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ width: '100%', background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)', borderRadius: '10px 10px 0 0', height: `${(currentPeriodData.penitipan / currentPeriodData.total) * 100}%`, minHeight: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '18px' }}>
                      {currentPeriodData.penitipan}
                    </div>
                    <div style={{ marginTop: '10px', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>Penitipan</div>
                  </div>
                )}
                {currentPeriodData.total === 0 && (
                  <div style={{ width: '100%', textAlign: 'center', color: '#9ca3af', padding: '40px' }}>
                    Belum ada data untuk periode ini
                  </div>
                )}
              </div>
            </div>

            {/* Top WBP */}
            {topWBP.length > 0 && (
              <div style={{ background: 'white', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700', color: '#1f2937' }}>👥 Top 5 WBP Paling Banyak Dikunjungi</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {topWBP.map(([wbp, count], idx) => (
                    <div key={wbp} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', background: '#f9fafb', borderRadius: '10px' }}>
                      <div style={{ width: '35px', height: '35px', borderRadius: '10px', background: idx === 0 ? '#fbbf24' : idx === 1 ? '#d1d5db' : idx === 2 ? '#f97316' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '14px', color: idx < 3 ? 'white' : '#6b7280' }}>
                        #{idx + 1}
                      </div>
                      <div style={{ flex: 1, fontWeight: '700', fontSize: '15px', color: '#111827' }}>{wbp}</div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#3b82f6' }}>{count} layanan</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Detail Button */}
            {currentPeriodData.total > 0 && (
              <button 
                onClick={openDetailView}
                style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)', border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 12px rgba(30, 64, 175, 0.3)' }}
              >
                📋 Lihat Detail Lengkap Data {formatPeriodDisplay()}
              </button>
            )}
          </div>
        )}

        {/* Verifikasi User Tab */}
        {tab === 'verifikasi' && (
          <div className="fade-in">
            <div style={{ background: 'white', borderRadius: '16px', padding: '8px' }}>
              {users.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#6b7280', padding: '60px' }}>Belum ada user terdaftar</p>
              ) : (
                users.map(u => (
                  <div key={u.id} style={{ padding: '20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flex: 1 }}>
                      <div style={{ width: '56px', height: '56px', background: '#eff6ff', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>👤</div>
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '16px', color: '#111827' }}>
                          {u.nama} {u.is_approved && <span style={{ background: '#d1fae5', color: '#065f46', fontSize: '10px', padding: '2px 10px', borderRadius: '20px', fontWeight: 'bold' }}>VERIFIED</span>}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280' }}>NIK: {u.nik} • WBP: {u.wbp}</div>
                        {u.foto_ktp_url && <a href={u.foto_ktp_url} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', fontSize: '12px', fontWeight: '600', textDecoration: 'none', display: 'inline-block', marginTop: '6px' }}>👁️ LIHAT KTP PENGUNJUNG</a>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {!u.is_approved && (
                        <button onClick={() => handleApprove(u.id)} style={{ background: '#10b981', border: 'none', color: 'white', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>Setujui</button>
                      )}
                      <button onClick={() => handleDeleteUser(u.id)} style={{ background: 'white', border: '1px solid #ef4444', color: '#ef4444', padding: '10px 20px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Hapus</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Monitoring Tiket Tab */}
        {tab === 'monitoring' && (
          <div className="fade-in">
            <div style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input 
                  placeholder="Cari nama pengunjung atau WBP..." 
                  style={{ flex: 1, padding: '12px 18px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px' }}
                  value={search} 
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select 
                  style={{ padding: '12px 18px', borderRadius: '12px', border: '1px solid #e5e7eb', fontSize: '14px', background: 'white' }} 
                  onChange={(e) => setFilterSesi(e.target.value)}
                >
                  <option value="Semua">Semua Sesi</option>
                  <option value="Pagi">Sesi Pagi</option>
                  <option value="Siang">Sesi Siang</option>
                  <option value="Titipan">Penitipan Barang</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '15px' }}>
              {filteredKunjungan.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '60px', background: 'white', borderRadius: '16px' }}>Tidak ada tiket ditemukan</div>
              ) : (
                filteredKunjungan.map(k => (
                  <div key={k.id} className="ticket-card-fancy" style={{ background: k.status === 'selesai' ? '#f9fafb' : 'white', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '20px', border: '1px solid #e5e7eb', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px', background: k.status === 'selesai' ? '#94a3b8' : (k.tipe === 'penitipan' ? '#10b981' : '#2563eb') }}></div>
                    <div style={{ width: '60px', height: '60px', borderRadius: '15px', background: k.tipe === 'penitipan' ? '#f0fdf4' : '#eff6ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px solid ${k.tipe === 'penitipan' ? '#10b981' : '#3b82f6'}` }}>
                      <span style={{ fontSize: '10px', fontWeight: 'bold' }}>NO</span>
                      <span style={{ fontSize: '22px', fontWeight: '800' }}>{k.antrean}</span>
                    </div>
                    <div 
                      onClick={() => window.open(k.tipe === 'penitipan' ? `/verify-item/${k.id}` : `/verify/${k.id}`, '_blank')} 
                      style={{ cursor: 'pointer', flex: 1 }}
                    >
                      <div style={{ fontSize: '16px', fontWeight: '700' }}>{k.nama_pengunjung} <span style={{ color: '#9ca3af', fontWeight: '400', margin: '0 5px' }}>→</span> {k.wbp}</div>
                      <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px', fontWeight: '500' }}>
                        {k.tipe === 'penitipan' ? '📦 Penitipan' : '👥 Kunjungan'} • {k.sesi || 'Barang'} {k.keterangan && `• ${k.keterangan}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      {k.status !== 'selesai' && (
                        <button onClick={() => handleUpdateStatus(k.id, 'selesai')} style={{ background: '#10b981', color: 'white', border: 'none', width: '42px', height: '42px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px' }}>✓</button>
                      )}
                      <button onClick={() => handleDeleteTiket(k.id)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '42px', height: '42px', borderRadius: '12px', cursor: 'pointer', fontSize: '18px' }}>🗑</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* QR Scanner Modal - UPDATED UI dengan html5-qrcode */}
      {showQRScanner && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ maxWidth: '500px', width: '100%', background: 'white', borderRadius: '20px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#1e40af' }}>📷 Scan QR Code Tiket</h3>
              <button onClick={() => setShowQRScanner(false)} style={{ background: '#fee2e2', color: '#ef4444', border: 'none', width: '36px', height: '36px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold' }}>✕</button>
            </div>
            
            <div style={{ background: '#000', borderRadius: '12px', padding: '10px', marginBottom: '20px', position: 'relative' }}>
              {/* AREA CAMERA - Target untuk html5-qrcode */}
              <div id="reader" style={{ width: '100%', borderRadius: '10px', overflow: 'hidden' }}></div>
              
              <p style={{ textAlign: 'center', color: '#10b981', fontSize: '13px', fontWeight: '700', marginTop: '10px', margin: '10px 0 0' }}>
                📱 Arahkan QR Code ke kamera
              </p>
            </div>
            
            {scanResult && (
              <div style={{ marginTop: '15px', padding: '10px', background: '#f0fdf4', borderRadius: '10px', fontSize: '12px', wordBreak: 'break-all', marginBottom: '15px' }}>
                <strong>Terdeteksi:</strong> {scanResult}
              </div>
            )}
            
            <div style={{ background: 'white', padding: '15px', borderRadius: '10px', border: '1px solid #e5e7eb' }}>
              <p style={{ margin: '0 0 10px', fontSize: '13px', fontWeight: '600', color: '#374151' }}>Atau masukkan URL manual:</p>
              <input 
                type="text"
                placeholder="Paste URL QR Code di sini..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px', marginBottom: '10px' }}
                onChange={(e) => setScanResult(e.target.value)}
                value={scanResult}
              />
              <button 
                onClick={() => handleManualQRInput(scanResult)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: '#1e40af', color: 'white', border: 'none', fontWeight: '700', cursor: 'pointer' }}
              >
                Buka Verifikasi
              </button>
            </div>

            <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '10px', fontSize: '12px', color: '#1e40af', textAlign: 'center', marginTop: '15px' }}>
              💡 Format URL: .../verify/[ID] atau .../verify-item/[ID]
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        .fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .ticket-card-fancy { transition: 0.3s; }
        .ticket-card-fancy:hover { transform: translateY(-3px); box-shadow: 0 10px 20px -5px rgba(0,0,0,0.1); border-color: #3b82f6 !important; }
      `}</style>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  return (
    <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden', border: '1px solid #f3f4f6' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', marginBottom: '8px', textTransform: 'uppercase' }}>{title}</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: '#111827' }}>{value}</div>
        </div>
        <div style={{ fontSize: '28px', background: `${color}15`, padding: '12px', borderRadius: '14px' }}>{icon}</div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button onClick={onClick} style={{ background: active ? 'white' : 'transparent', border: 'none', padding: '10px 18px', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '13px', color: active ? '#1e40af' : '#6b7280', boxShadow: active ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ fontSize: '16px' }}>{icon}</span> {label}
    </button>
  );
}