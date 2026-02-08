import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";

export default function TiketPenitipanUser() {
  // SESUAIKAN: Mengambil dari "tiket_aktif" agar sinkron dengan Penitipan.jsx
  const t = JSON.parse(localStorage.getItem("tiket_aktif"));
  const navigate = useNavigate();
  
  // Ambil origin URL secara dinamis (misal: https://sipena-app.vercel.app)
  const currentDomain = window.location.origin;

  // Fungsi format tanggal lokal (26 Januari 2026)
  const formatTanggal = (dateString) => {
    if (!dateString) return "-";
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (!t) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', padding: '20px' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Data penitipan tidak ditemukan.</p>
          <button 
            style={{ background: '#059669', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
            onClick={() => navigate("/dashboard")}
          >
            Kembali ke Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- LOGIC TERBARU: SINKRON DENGAN TIKET KUNJUNGAN ---
  // Menghasilkan URL Link: https://domain.com/verify/ID
  const qrCodeValue = `${currentDomain}/verify/${t.id}`;

  return (
    <div className="app" style={{ background: '#064e3b', minHeight: '100vh', padding: '30px 20px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER TIKET */}
      <div className="no-print" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: '18px', letterSpacing: '1px', fontWeight: '800' }}>E-TIKET PENITIPAN</h2>
      </div>

      <div className="ticket" style={{ 
        background: '#fff', 
        borderRadius: '25px', 
        overflow: 'hidden', 
        maxWidth: '400px', 
        margin: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
        position: 'relative'
      }}>
        
        {/* BRANDING TOP */}
        <div style={{ background: '#059669', padding: '15px', textAlign: 'center' }}>
          <h2 style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: '800' }}>SIPENA BARANG</h2>
          <p style={{ color: '#d1fae5', fontSize: '10px', margin: 0 }}>Lapas Kelas IIA Kerobokan</p>
        </div>

        <div style={{ padding: '25px' }}>
          
          {/* SEKSI TUJUAN WBP */}
          <div style={{ 
            background: '#f8fafc', 
            border: '2px solid #e2e8f0', 
            borderRadius: '15px', 
            padding: '20px 15px', 
            textAlign: 'center',
            marginBottom: '20px',
            position: 'relative'
          }}>
            <span style={{ 
              position: 'absolute', top: '-11px', left: '50%', transform: 'translateX(-50%)',
              background: '#059669', color: 'white', padding: '3px 12px', borderRadius: '8px',
              fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px'
            }}>TUJUAN WBP</span>
            
            <h1 style={{ margin: 0, fontSize: '26px', color: '#1e293b', fontWeight: '900', textTransform: 'uppercase', lineHeight: '1.2' }}>
              {t.wbp}
            </h1>
          </div>

          {/* QR CODE SECTION - UPDATED LOGIC */}
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{ display: 'inline-block', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '20px', background: 'white' }}>
              <QRCode 
                value={qrCodeValue} 
                size={150}
                level="H"
              />
            </div>
            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>ID: {t.id}</p>
            {/* Debugging Link (Kecil) */}
            <p style={{ fontSize: '7px', color: '#cbd5e1', wordBreak: 'break-all', maxWidth: '200px', margin: '5px auto 0' }}>{qrCodeValue}</p>
          </div>

          <hr style={{ border: 'none', borderTop: '2px dashed #f1f5f9', margin: '20px 0' }} />

          {/* INFORMASI PENITIP & TANGGAL */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Penitip</span>
              <b style={{ color: '#1e293b', fontSize: '14px' }}>{t.nama_pengunjung}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Tanggal Titip</span>
              <b style={{ color: '#1e293b', fontSize: '14px' }}>{formatTanggal(t.tanggal)}</b>
            </div>
          </div>

          {/* NOMOR ANTREAN JUMBO */}
          <div style={{ textAlign: 'center', background: '#ecfdf5', padding: '15px', borderRadius: '20px', border: '1px solid #d1fae5' }}>
            <span style={{ color: '#059669', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>NOMOR ANTREAN</span>
            <div style={{ fontSize: '65px', fontWeight: '900', color: '#059669', lineHeight: '1', marginTop: '5px' }}>
              {t.antrean}
            </div>
          </div>

          {/* KETERANGAN BARANG */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>KET. BARANG:</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569', fontWeight: '600', lineHeight: '1.4' }}>
              {t.keterangan || t.ket || "Tanpa rincian barang."}
            </p>
          </div>

        </div>

        {/* FOOTER INFO */}
        <div style={{ background: '#059669', padding: '12px', textAlign: 'center' }}>
           <p style={{ margin: 0, fontSize: '11px', color: 'white', fontWeight: '700' }}>
             TUNJUKKAN TIKET INI PADA PETUGAS LOKET
           </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ padding: '25px 0', maxWidth: '400px', margin: 'auto' }} className="no-print">
        <button 
          onClick={() => window.print()} 
          style={{ 
            width: '100%', padding: '16px', borderRadius: '15px', border: 'none', 
            background: '#10b981', color: 'white', fontWeight: 'bold', fontSize: '16px',
            cursor: 'pointer', marginBottom: '12px', boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
          }}
        >
          📥 SIMPAN TIKET (PDF / GAMBAR)
        </button>
        <button 
          onClick={() => navigate("/dashboard")}
          style={{ 
            width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #6ee7b7', 
            background: 'transparent', color: '#6ee7b7', fontWeight: 'bold', cursor: 'pointer'
          }}
        >
          SELESAI
        </button>
      </div>

      {/* PRINT CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; padding: 0 !important; }
          .app { background: white !important; padding: 0 !important; }
          .ticket { 
            box-shadow: none !important; 
            border: 1px solid #eee !important; 
            margin: 0 !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
        }
      `}} />
    </div>
  );
}