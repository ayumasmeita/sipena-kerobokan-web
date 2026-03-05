import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  
  const getJadwalBlok = () => {
    const hari = new Date().getDay(); 
    const jadwal = {
      1: ["YUDISTIRA A"],
      2: ["YUDISTIRA B"],
      3: ["BIMA C"],
      4: ["BIMA D"],
      5: ["ARJUNA E", "ARJUNA F", "KLINIK", "DAPUR"],
      6: ["LIBUR"],
      0: ["LIBUR"]
    };
    return jadwal[hari] || ["TUTUP"];
  };

  const jadwalArray = getJadwalBlok();
  const jadwalHariIni = jadwalArray.join(jadwalArray.length > 1 ? " & " : "");
  const isTutup = jadwalArray.includes("LIBUR");
  const userBlok = user?.blok_wbp?.toUpperCase().trim();
  const isJadwalCocok = jadwalArray.some(blok => blok === userBlok);
  const isApproved = user?.is_approved === true || user?.is_approved === 'true';

  useEffect(() => {
    if (!user) navigate("/");
  }, [user, navigate]);

  return (
    <div className="app-container">
      {/* HEADER */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        padding: 'clamp(20px, 4vw, 32px) clamp(20px, 4vw, 32px)',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderRadius: '0 0 28px 28px',
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.4)',
        gap: '16px',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2vw, 16px)', flex: '1 1 auto', minWidth: '200px' }}>
          <div style={{ 
            width: 'clamp(40px, 8vw, 52px)',
            height: 'clamp(40px, 8vw, 52px)',
            background: 'rgba(59, 130, 246, 0.2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(18px, 4vw, 24px)',
            border: '2px solid rgba(59, 130, 246, 0.3)',
            flexShrink: 0
          }}>👤</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 'clamp(11px, 2vw, 12px)', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Selamat Datang,
            </p>
            <h2 style={{ 
              margin: 0,
              fontSize: 'clamp(15px, 3vw, 18px)',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 800,
              letterSpacing: '-0.3px',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {user?.nama || "Pengguna"}
            </h2>
          </div>
        </div>
        <button 
          onClick={() => { localStorage.removeItem("user"); navigate("/"); }} 
          className="logout-mini"
        >
          Keluar
        </button>
      </div>

      <div style={{ padding: 'clamp(16px, 3vw, 24px)' }}>
        
        {/* CARD STATUS JADWAL */}
        <div style={{ 
          background: isTutup ? '#fee2e2' : 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
          padding: 'clamp(18px, 3vw, 28px)',
          borderRadius: '24px',
          marginBottom: 'clamp(16px, 3vw, 24px)',
          border: `2px solid ${isTutup ? '#fecaca' : '#bfdbfe'}`,
          boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '14px',
            fontSize: 'clamp(11px, 2vw, 13px)',
            fontWeight: 'bold',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{ color: '#1e40af' }}>
              📅 {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <span style={{ 
              background: isTutup ? '#ef4444' : '#3b82f6',
              color: 'white',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: 'clamp(10px, 2vw, 12px)',
              letterSpacing: '0.5px'
            }}>
              {isTutup ? "Layanan Libur" : "Layanan Buka"}
            </span>
          </div>
          <p style={{ margin: '0 0 6px 0', fontSize: 'clamp(12px, 2vw, 14px)', color: '#1e40af', fontWeight: 600 }}>
            Jadwal Besuk Hari Ini:
          </p>
          <h1 style={{ 
            margin: '0 0 16px 0',
            fontSize: 'clamp(20px, 4vw, 28px)',
            color: '#0f172a',
            fontFamily: '"Outfit", sans-serif',
            fontWeight: 900,
            letterSpacing: '-0.5px'
          }}>
            {jadwalHariIni}
          </h1>

          {/* INFORMASI DASHBOARD */}
          <div style={{ 
            marginTop: '16px',
            padding: 'clamp(12px, 2.5vw, 16px)',
            borderRadius: '16px',
            fontSize: 'clamp(12px, 2vw, 13px)',
            lineHeight: '1.6',
            background: 'white',
            color: '#334155',
            border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
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

        {/* INFO DATA USER - RESPONSIVE GRID */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 'clamp(10px, 2vw, 14px)',
          marginBottom: 'clamp(16px, 3vw, 24px)'
        }}>
          <div style={{ 
            background: 'white',
            padding: 'clamp(14px, 2.5vw, 18px)',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <p style={{ margin: 0, fontSize: 'clamp(10px, 1.8vw, 11px)', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
              WBP TUJUAN
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 'bold', color: '#0f172a' }}>
              {user?.wbp}
            </p>
          </div>
          <div style={{ 
            background: 'white',
            padding: 'clamp(14px, 2.5vw, 18px)',
            borderRadius: '18px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}>
            <p style={{ margin: 0, fontSize: 'clamp(10px, 1.8vw, 11px)', color: '#64748b', fontWeight: 700, letterSpacing: '0.5px' }}>
              BLOK / KAMAR
            </p>
            <p style={{ margin: '6px 0 0', fontSize: 'clamp(12px, 2.5vw, 14px)', fontWeight: 'bold', color: '#0f172a' }}>
              {user?.blok_wbp} / {user?.kamar_wbp}
            </p>
          </div>
        </div>

        {/* MENU UTAMA - USING CSS CLASSES */}
        <div className="main-menu">
          <Link to={isApproved ? "/kunjungan" : "#"} style={{ textDecoration: 'none', opacity: isApproved ? 1 : 0.6 }}>
            <div className="menu-card">
              <div className="menu-icon">👥</div>
              <div className="menu-text">
                <h3>Pendaftaran Kunjungan</h3>
                <p>Booking untuk kunjungan fisik (H-1)</p>
              </div>
              {!isApproved && <span className="lock-icon">🔒</span>}
            </div>
          </Link>

          <Link to={isApproved ? "/penitipan" : "#"} style={{ textDecoration: 'none', opacity: isApproved ? 1 : 0.6 }}>
            <div className="menu-card">
              <div className="menu-icon">📦</div>
              <div className="menu-text">
                <h3>Penitipan Barang</h3>
                <p>Titip makanan atau pakaian</p>
              </div>
              {!isApproved && <span className="lock-icon">🔒</span>}
            </div>
          </Link>

          <Link to="/history" style={{ textDecoration: 'none' }}>
            <div className="menu-card secondary">
              <div className="menu-icon">📜</div>
              <div className="menu-text">
                <h3>Riwayat Layanan</h3>
                <p>Cek status tiket & antrean</p>
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}