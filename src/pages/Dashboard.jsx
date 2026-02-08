import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  
  // --- PERBAIKAN LOGIC START ---
  const getJadwalBlok = () => {
    const hari = new Date().getDay(); 
    const jadwal = {
      1: ["YUDISTIRA A"],
      2: ["YUDISTIRA B"],
      3: ["BIMA C"],
      4: ["BIMA D"],
      5: ["ARJUNA E", "ARJUNA F", "KLINIK", "DAPUR"], // Penambahan Klinik & Dapur
      6: ["LIBUR"],
      0: ["LIBUR"]
    };
    return jadwal[hari] || ["TUTUP"];
  };

  const jadwalArray = getJadwalBlok();
  
  // Tampilan teks untuk UI (menggabungkan isi array menjadi string)
  const jadwalHariIni = jadwalArray.join(jadwalArray.length > 1 ? " & " : "");
  
  const isTutup = jadwalArray.includes("LIBUR");

  // Perbaikan Bug: Cek apakah blok user ada di dalam daftar jadwal hari ini
  // Menggunakan toUpperCase() dan trim() untuk menghindari salah ketik data
  const userBlok = user?.blok_wbp?.toUpperCase().trim();
  const isJadwalCocok = jadwalArray.some(blok => blok === userBlok);
  
  const isApproved = user?.is_approved === true || user?.is_approved === 'true';
  // --- PERBAIKAN LOGIC END ---

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  return (
    <div className="app-container" style={{ maxWidth: '500px', margin: 'auto', background: '#f8fafc', minHeight: '100vh' }}>
      {/* HEADER */}
      <div style={{ background: '#0f172a', padding: '25px 20px', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '0 0 20px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '45px', height: '45px', background: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>
          <div>
            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>Selamat Datang,</p>
            <h2 style={{ margin: 0, fontSize: '16px' }}>{user?.nama || "Pengguna"}</h2>
          </div>
        </div>
        <button onClick={() => { localStorage.removeItem("user"); navigate("/"); }} 
          style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid #ef4444', padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>
          Keluar
        </button>
      </div>

      <div style={{ padding: '20px' }}>
        
        {/* CARD STATUS JADWAL */}
        <div style={{ 
          background: isTutup ? '#fee2e2' : '#dbeafe', 
          padding: '20px', borderRadius: '20px', marginBottom: '20px',
          border: `1px solid ${isTutup ? '#fecaca' : '#bfdbfe'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '12px', fontWeight: 'bold' }}>
            <span style={{ color: '#1e40af' }}>📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <span style={{ background: isTutup ? '#ef4444' : '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '5px' }}>
              {isTutup ? "Layanan Libur" : "Layanan Buka"}
            </span>
          </div>
          <p style={{ margin: '0', fontSize: '13px', color: '#1e40af' }}>Jadwal Besuk Hari Ini:</p>
          <h1 style={{ margin: '5px 0', fontSize: '24px', color: '#1e3a8a' }}>{jadwalHariIni}</h1>

          {/* INFORMASI DASHBOARD */}
          <div style={{ 
            marginTop: '15px', padding: '12px', borderRadius: '12px', fontSize: '12px', lineHeight: '1.5',
            background: 'white', color: '#334155', border: '1px solid rgba(0,0,0,0.05)'
          }}>
            {isApproved ? (
              isJadwalCocok ? (
                <span>✅ Hari ini jadwal blok Anda! Silakan lakukan pendaftaran.</span>
              ) : (
                <span>💡 Anda tetap bisa mendaftar hari ini untuk jadwal <b>{user?.blok_wbp}</b> di hari kerja berikutnya (Pendaftaran H-1).</span>
              )
            ) : (
              <span style={{ color: '#b45309' }}>⏳ Akun Anda sedang diverifikasi. Fitur pendaftaran akan terbuka segera.</span>
            )}
          </div>
        </div>

        {/* INFO DATA USER */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: 'white', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>WBP TUJUAN</p>
            <p style={{ margin: '5px 0 0', fontSize: '13px', fontWeight: 'bold' }}>{user?.wbp}</p>
          </div>
          <div style={{ background: 'white', padding: '15px', borderRadius: '15px', border: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>BLOK / KAMAR</p>
            <p style={{ margin: '5px 0 0', fontSize: '13px', fontWeight: 'bold' }}>{user?.blok_wbp} / {user?.kamar_wbp}</p>
          </div>
        </div>

        {/* MENU UTAMA */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link to={isApproved ? "/kunjungan" : "#"} style={{ textDecoration: 'none', opacity: isApproved ? 1 : 0.6 }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '30px' }}>👥</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Pendaftaran Kunjungan</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Booking untuk kunjungan fisik (H-1)</p>
              </div>
              {!isApproved && <span>🔒</span>}
            </div>
          </Link>

          <Link to={isApproved ? "/penitipan" : "#"} style={{ textDecoration: 'none', opacity: isApproved ? 1 : 0.6 }}>
            <div style={{ background: 'white', padding: '20px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
              <div style={{ fontSize: '30px' }}>📦</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '16px', color: '#0f172a' }}>Penitipan Barang</h3>
                <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Titip makanan atau pakaian</p>
              </div>
              {!isApproved && <span>🔒</span>}
            </div>
          </Link>

          <Link to="/history" style={{ textDecoration: 'none' }}>
            <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '18px', display: 'flex', alignItems: 'center', gap: '15px', border: '1px dashed #cbd5e1' }}>
              <div style={{ fontSize: '24px' }}>📜</div>
              <div style={{ flex: 1 }}>
                <h3 style={{ margin: 0, fontSize: '14px', color: '#475569' }}>Riwayat Layanan</h3>
                <p style={{ margin: 0, fontSize: '11px', color: '#64748b' }}>Cek status tiket & antrean</p>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}