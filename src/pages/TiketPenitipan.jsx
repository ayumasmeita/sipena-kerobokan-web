import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";

export default function TiketPenitipan() {
  const [t, setT] = useState(null);
  const navigate = useNavigate();
  
  const currentDomain = window.location.origin;

  useEffect(() => {
    // Mengambil data dari 'tiket_aktif' (key standar pendaftaran)
    // atau 'tiket_penitipan' (fallback jika dari riwayat)
    const dataAktif = localStorage.getItem("tiket_aktif");
    const dataPenitipan = localStorage.getItem("tiket_penitipan");
    
    const storageData = dataAktif || dataPenitipan;

    if (storageData) {
      try {
        const parsedData = JSON.parse(storageData);
        setT(parsedData);
      } catch (err) {
        console.error("Error parsing data tiket:", err);
      }
    }
  }, []);

  const formatTanggal = (dateString) => {
    if (!dateString) return "-";
    try {
      const options = { day: 'numeric', month: 'long', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('id-ID', options);
    } catch (e) {
      return dateString;
    }
  };

  if (!t) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#064e3b', padding: '20px' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '50px', marginBottom: '10px' }}>🔍</div>
          <p style={{ color: '#64748b', marginBottom: '20px', fontWeight: '500' }}>Tiket tidak ditemukan.</p>
          <button 
            style={{ background: '#059669', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}
            onClick={() => navigate("/penitipan")}
          >
            Kembali ke Pendaftaran
          </button>
        </div>
      </div>
    );
  }

  // QR Code mengarah ke link verifikasi publik
  const qrCodeValue = `${currentDomain}/verify-item/${t.id}`;

  return (
    <div className="app-container" style={{ 
      maxWidth: '450px', margin: 'auto', minHeight: '100vh', 
      background: '#064e3b', padding: '40px 20px', fontFamily: 'Inter, sans-serif' 
    }}>
      
      <div style={{ textAlign: 'center', marginBottom: '25px' }} className="no-print">
        <h2 style={{ color: 'white', margin: 0, fontSize: '20px', letterSpacing: '2px', fontWeight: '800' }}>E-TICKET</h2>
        <p style={{ color: '#6ee7b7', fontSize: '11px', marginTop: '5px', fontWeight: 'bold', opacity: 0.8 }}>SIPENA - LAPAS KELAS IIA KEROBOKAN</p>
      </div>

      <div style={{ 
        background: 'white', borderRadius: '25px', overflow: 'hidden', 
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        position: 'relative'
      }}>
        
        <div style={{ height: '8px', background: '#059669' }}></div>

        <div style={{ padding: '30px 30px 20px', textAlign: 'center' }}>
          <div style={{ 
            display: 'inline-block', padding: '6px 16px', borderRadius: '20px', 
            background: '#f0fdf4', color: '#059669',
            fontSize: '10px', fontWeight: '800', marginBottom: '15px', textTransform: 'uppercase',
            border: '1px solid #d1fae5'
          }}>
            Penitipan Barang
          </div>
          
          <h1 style={{ margin: 0, fontSize: '24px', color: '#0f172a', fontWeight: '800', textTransform: 'uppercase', lineHeight: '1.2' }}>
            {t.wbp || t.wbp_name || 'NAMA WBP'}
          </h1>
          
          {/* --- PERBAIKAN: Tampilan Blok/Kamar WBP --- */}
          <p style={{ 
            margin: '8px 0 0', 
            color: '#059669', 
            fontSize: '14px', 
            fontWeight: 'bold', 
            background: '#ecfdf5', 
            padding: '5px 12px', 
            borderRadius: '8px', 
            display: 'inline-block',
            border: '1px solid #a7f3d0'
          }}>
            Blok/Kamar: {t.kamar_wbp || '-'}
          </p>
          
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Nama Warga Binaan (Tujuan)</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '0 -12px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#064e3b' }}></div>
          <div style={{ flex: 1, borderBottom: '2px dashed #f1f5f9', margin: '0 10px' }}></div>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#064e3b' }}></div>
        </div>

        <div style={{ padding: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '25px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.5px' }}>PENITIP</p>
              <p style={{ margin: '4px 0 0', fontSize: '15px', color: '#1e293b', fontWeight: '700' }}>{t.nama_pengunjung || '-'}</p>
              
              {/* --- TAMPILAN BARU: NO HP --- */}
              <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b', fontWeight: '600' }}>📞 {t.hp_penitip || t.penitip_hp || '-'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.5px' }}>TANGGAL</p>
              <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#1e293b', fontWeight: '600' }}>{formatTanggal(t.tanggal)}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', marginBottom: '30px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.5px' }}>NO. ANTREAN</p>
              <p style={{ margin: '2px 0 0', fontSize: '42px', color: '#059669', fontWeight: '900', lineHeight: '1' }}>{t.antrean || '00'}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.5px' }}>STATUS</p>
              <div style={{ 
                marginTop: '6px',
                fontSize: '11px', 
                color: '#b45309', 
                fontWeight: '800',
                background: '#fffbeb',
                padding: '4px 10px',
                borderRadius: '8px',
                display: 'inline-block',
                border: '1px solid #fef3c7'
              }}>
                {(t.status || 'PENDING').toUpperCase()}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: '30px', background: '#f8fafc', padding: '15px', borderRadius: '15px', border: '1px solid #f1f5f9' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '10px', color: '#64748b', fontWeight: '800' }}>KETERANGAN BARANG:</p>
            {/* Menggunakan whiteSpace pre-line agar enter di textarea terbaca */}
            <p style={{ margin: 0, fontSize: '13px', color: '#334155', lineHeight: '1.5', fontWeight: '600', whiteSpace: 'pre-line' }}>
              {t.keterangan || t.ket || "Tanpa rincian barang."}
            </p>
          </div>

          <div style={{ 
            background: 'white', padding: '20px', borderRadius: '25px', 
            textAlign: 'center', border: '2px solid #f1f5f9' 
          }}>
            <div style={{ background: 'white', padding: '10px', display: 'inline-block', borderRadius: '15px' }}>
              <QRCode 
                value={qrCodeValue} 
                size={160} 
                level="H" 
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
              />
            </div>
            <div style={{ marginTop: '15px' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: '700' }}>ID TRANSAKSI</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#475569', fontWeight: '700', fontFamily: 'monospace' }}>{t.id}</p>
            </div>
          </div>
        </div>

        <div style={{ background: '#f0fdf4', padding: '15px 25px', textAlign: 'center', borderTop: '1px solid #d1fae5' }}>
          <p style={{ margin: 0, fontSize: '11px', color: '#065f46', fontWeight: '700', lineHeight: '1.4' }}>
            Silakan tunjukkan QR Code ini ke petugas di loket pemeriksaan barang.
          </p>
        </div>
      </div>

      <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '12px' }} className="no-print">
        <button 
          onClick={() => window.print()} 
          style={{ 
            width: '100%', padding: '16px', borderRadius: '15px', border: 'none', 
            background: '#10b981', color: 'white', fontWeight: 'bold', cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)', fontSize: '15px'
          }}
        >
          📥 SIMPAN TIKET (PDF)
        </button>
        <button 
          onClick={() => navigate('/history')} 
          style={{ 
            width: '100%', padding: '16px', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.3)', 
            background: 'rgba(255,255,255,0.1)', color: 'white', fontWeight: '600', cursor: 'pointer', fontSize: '14px'
          }}
        >
          LIHAT RIWAYAT SAYA
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          .app-container { padding: 0 !important; background: white !important; max-width: 100% !important; margin: 0 !important; }
          .no-print { display: none !important; }
          div { box-shadow: none !important; border: none !important; }
        }
      `}} />
    </div>
  );
}