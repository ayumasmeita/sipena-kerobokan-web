import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Ambil user di dalam useEffect agar tidak memicu loop
    const userString = localStorage.getItem("user");
    
    if (!userString) {
      navigate('/login');
      return;
    }

    const userData = JSON.parse(userString);
    fetchHistory(userData.id);
    
    // Dependency array kosong [] memastikan ini hanya jalan 1x saat page di-load
  }, []);

  const fetchHistory = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('kunjungan')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error("Gagal mengambil riwayat:", err.message);
      alert("Gagal memuat riwayat: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLihatTiket = (item) => {
    // Simpan data ke key universal 'tiket_aktif' agar mudah dibaca halaman tujuan
    localStorage.setItem("tiket_aktif", JSON.stringify(item));
    
    // Logika Navigasi Dinamis
    if (item.tipe === 'penitipan') {
      navigate("/tiket-penitipan");
    } else {
      navigate("/tiket-kunjungan");
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '500px', margin: 'auto', minHeight: '100vh', background: '#f8fafc' }}>
      {/* HEADER */}
      <div style={{ background: '#0f172a', padding: '30px 20px', color: 'white', textAlign: 'center', borderRadius: '0 0 20px 20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px' }}>Riwayat Layanan</h2>
        <p style={{ margin: '5px 0 0', fontSize: '12px', color: '#94a3b8' }}>Daftar kunjungan dan penitipan Anda</p>
      </div>

      <div style={{ padding: '20px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <div className="spinner"></div>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '10px' }}>Mengambil data...</p>
          </div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0' }}>
            <p style={{ color: '#64748b' }}>Belum ada riwayat pendaftaran.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {history.map((item) => (
              <div 
                key={item.id} 
                className="history-card"
                onClick={() => handleLihatTiket(item)}
                style={{ 
                  background: 'white', borderRadius: '16px', padding: '16px', 
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0',
                  cursor: 'pointer', position: 'relative', overflow: 'hidden'
                }}
              >
                {/* Indikator Warna Samping */}
                <div style={{ 
                  position: 'absolute', left: 0, top: 0, bottom: 0, width: '6px',
                  background: item.tipe === 'penitipan' ? '#10b981' : '#3b82f6'
                }}></div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>
                      {item.tipe === 'penitipan' ? '📦 Penitipan Barang' : '👥 Kunjungan Fisik'}
                    </span>
                    <h3 style={{ margin: '4px 0 0', fontSize: '16px', color: '#0f172a' }}>{item.wbp}</h3>
                  </div>
                  <div style={{ 
                    fontSize: '10px', padding: '4px 10px', borderRadius: '20px', fontWeight: 'bold',
                    background: item.status === 'selesai' ? '#dcfce7' : '#eff6ff',
                    color: item.status === 'selesai' ? '#15803d' : '#1d4ed8'
                  }}>
                    {(item.status || 'PENDING').toUpperCase()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '15px', borderTop: '1px dashed #e2e8f0', paddingTop: '12px' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>TANGGAL</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>{item.tanggal}</p>
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>ANTREAN</p>
                    <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: item.tipe === 'penitipan' ? '#10b981' : '#3b82f6' }}>
                      #{item.antrean}
                    </p>
                  </div>
                  <div style={{ marginLeft: 'auto', alignSelf: 'center' }}>
                    <span style={{ color: '#3b82f6', fontSize: '12px', fontWeight: 'bold' }}>LIHAT →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0 20px 40px' }}>
        <button 
          onClick={() => navigate("/dashboard")} 
          style={{ 
            width: '100%', padding: '14px', borderRadius: '12px', 
            border: '1px solid #e2e8f0', background: 'white', 
            color: '#475569', fontWeight: 'bold', cursor: 'pointer' 
          }}
        >
          Kembali ke Dashboard
        </button>
      </div>

      <style>{`
        .history-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .history-card:hover { box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .history-card:active { transform: scale(0.98); }
        .spinner { 
          width: 30px; 
          height: 30px; 
          border: 4px solid #f3f3f3; 
          border-top: 4px solid #3b82f6; 
          border-radius: 50%; 
          animation: spin 1s linear infinite; 
          margin: auto; 
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}