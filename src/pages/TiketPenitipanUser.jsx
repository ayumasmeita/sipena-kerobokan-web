import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from "react-qr-code";

export default function TiketPenitipanUser() {
  const [t, setT] = useState(null);
  const navigate = useNavigate();
  
  const currentDomain = window.location.origin;

  useEffect(() => {
    // Ambil data dari 'tiket_aktif' yang diset di Penitipan.jsx
    const dataAktif = localStorage.getItem("tiket_aktif");
    
    if (dataAktif) {
      try {
        setT(JSON.parse(dataAktif));
      } catch (err) {
        console.error("Error parsing data tiket:", err);
      }
    }
  }, []);

  const formatTanggal = (dateString) => {
    if (!dateString) return "-";
    const options = { day: 'numeric', month: 'long', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
  };

  if (!t) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', padding: '20px' }}>
        <div style={{ textAlign: 'center', background: 'white', padding: '30px', borderRadius: '20px', width: '100%', maxWidth: '400px', boxShadow: '0 10px 15px rgba(0,0,0,0.05)' }}>
          <p style={{ color: '#64748b', marginBottom: '20px' }}>Data tiket tidak ditemukan.</p>
          <button 
            onClick={() => navigate("/dashboard")} 
            style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#059669', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  // URL untuk QR Code Verifikasi Petugas
  const qrCodeValue = `${currentDomain}/verify-item/${t.id}`;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#059669', 
      padding: '20px', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif' 
    }}>
      <div style={{ 
        background: 'white', 
        borderRadius: '20px', 
        padding: '20px', 
        maxWidth: '380px', 
        margin: '0 auto', 
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
      }}>
        
        <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '2px dashed #e2e8f0', paddingBottom: '10px' }}>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#059669' }}>E-TIKET PENITIPAN</div>
          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1f2937' }}>SIPENA BARANG</div>
          <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase' }}>Lapas Kelas IIA Kerobokan</div>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '2px' }}>TUJUAN WBP</div>
          <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{t.wbp || 'Nama WBP'}</div>
          
          {/* --- TAMPILAN BLOK/KAMAR WBP --- */}
          <div style={{ 
            fontSize: '12px', 
            fontWeight: 'bold', 
            color: '#059669', 
            background: '#f0fdf4', 
            display: 'inline-block', 
            padding: '3px 10px', 
            borderRadius: '6px', 
            marginTop: '5px',
            border: '1px solid #bbf7d0'
          }}>
            Blok/Kamar: {t.blok_wbp || '-'}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px' }}>
          <div style={{ background: 'white', padding: '10px', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            <QRCode value={qrCodeValue} size={130} />
          </div>
        </div>

        <div style={{ fontSize: '12px', color: '#475569', background: '#f8fafc', padding: '10px', borderRadius: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Tanggal</span>
            <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{formatTanggal(t.tanggal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>Penitip</span>
            <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{t.nama_pengunjung || '-'}</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>No. HP</span>
            <span style={{ fontWeight: 'bold', color: '#1f2937' }}>{t.hp_penitip || '-'}</span>
          </div>
          
          {/* --- DETAIL BARANG --- */}
          <div style={{ marginTop: '10px', borderTop: '1px solid #e2e8f0', paddingTop: '5px' }}>
            <div style={{ fontWeight: 'bold', color: '#1f2937' }}>RINCIAN BARANG:</div>
            <div style={{ color: '#475569', fontSize: '11px', marginTop: '3px', whiteSpace: 'pre-line' }}>{t.keterangan || '-'}</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '10px', color: '#059669', fontWeight: 'bold' }}>
          TUNJUKKAN TIKET INI PADA PETUGAS
        </div>
      </div>

      <div style={{ maxWidth: '380px', margin: '20px auto 0' }}>
        <button 
          onClick={() => navigate("/dashboard")}
          style={{ 
            width: '100%', 
            padding: '14px', 
            borderRadius: '12px', 
            border: 'none', 
            background: 'white', 
            color: '#059669', 
            fontWeight: 'bold', 
            cursor: 'pointer',
            fontSize: '15px'
          }}
        >
          SELESAI
        </button>
      </div>
    </div>
  );
}