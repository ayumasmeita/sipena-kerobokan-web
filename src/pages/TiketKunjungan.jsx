import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';

export default function TiketKunjungan() {
  const [tiket, setTiket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dataAktif = localStorage.getItem("tiket_aktif");
    if (dataAktif) {
      setTiket(JSON.parse(dataAktif));
    } else {
      navigate('/history');
    }
  }, [navigate]);

  if (!tiket) return null;

  // Link API untuk verifikasi admin
  const qrCodeValue = `${window.location.origin}/verify/${tiket.id}`;

  return (
    <div className="app-container" style={{ maxWidth: '400px', margin: 'auto', minHeight: '100vh', background: '#0f172a', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Header Tiket */}
      <div style={{ textAlign: 'center', marginBottom: '25px' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: '22px', letterSpacing: '2px' }}>E-TICKET</h2>
        <p style={{ color: '#3b82f6', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>SIPENA KUNJUNGAN FISIK</p>
      </div>

      {/* Kartu Tiket */}
      <div style={{ background: 'white', borderRadius: '24px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>
        
        {/* Atas Kartu */}
        <div style={{ padding: '25px', textAlign: 'center', background: 'white' }}>
          <div style={{ background: '#eff6ff', color: '#3b82f6', fontSize: '11px', fontWeight: 'bold', padding: '8px 16px', borderRadius: '20px', display: 'inline-block', marginBottom: '15px' }}>
            Lapas Kelas IIA Kerobokan
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>Tujuan Kunjungan</p>
          <h1 style={{ margin: '5px 0 0', fontSize: '24px', color: '#0f172a', fontWeight: '800' }}>{tiket.wbp}</h1>
        </div>

        {/* Separator */}
        <div style={{ display: 'flex', alignItems: 'center', margin: '0 -15px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0f172a', transform: 'translateX(-50%)' }}></div>
          <div style={{ flex: 1, borderBottom: '2px dashed #e2e8f0' }}></div>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0f172a', transform: 'translateX(50%)' }}></div>
        </div>

        {/* Bawah Kartu */}
        <div style={{ padding: '25px', background: 'white' }}>
          
          {/* Detail Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px', textAlign: 'center' }}>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Tanggal</p>
              <p style={{ margin: '5px 0 0', fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{tiket.tanggal}</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Sesi / Jam</p>
              <p style={{ margin: '5px 0 0', fontWeight: 'bold', fontSize: '15px', color: '#0f172a' }}>{tiket.sesi} ({tiket.jam})</p>
            </div>
          </div>
          
          {/* QR Code */}
          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
            <QRCode value={qrCodeValue} size={150} />
            <p style={{ margin: '15px 0 0', fontSize: '12px', color: '#2563eb', fontWeight: 'bold', lineHeight: '1.4' }}>
              Tunjukkan QR Code ini pada petugas di lokasi untuk check-in.
            </p>
          </div>
        </div>
      </div>

      {/* Tombol Kembali */}
      <div style={{ marginTop: '30px' }}>
        <button onClick={() => navigate('/history')} style={{ width: '100%', padding: '16px', borderRadius: '12px', background: '#1e293b', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', boxShadow: '0 4px 6px rgba(0,0,0,0.2)' }}>
          KEMBALI KE RIWAYAT
        </button>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .app-container, .app-container * { visibility: visible; }
          button { display: none !important; }
          .app-container { background: white !important; padding: 0 !important; }
        }
      `}</style>
    </div>
  );
}