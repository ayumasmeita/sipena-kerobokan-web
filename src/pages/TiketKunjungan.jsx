import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';

export default function TiketKunjungan() {
  const [tiket, setTiket] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const dataAktif = localStorage.getItem("tiket_aktif");
    const dataKunjungan = localStorage.getItem("tiket_kunjungan");
    const data = dataAktif || dataKunjungan;
    if (data) {
      try {
        setTiket(JSON.parse(data));
      } catch (err) {
        navigate('/history');
      }
    } else {
      navigate('/history');
    }
  }, [navigate]);

  if (!tiket) return null;

  const qrCodeValue = `${window.location.origin}/verify/${tiket.id}`;

  return (
    <div className="app-container" style={{ maxWidth: '450px', margin: 'auto', minHeight: '100vh', background: '#0f172a', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h2 style={{ color: 'white', margin: 0, fontSize: '22px', letterSpacing: '2px' }}>E-TICKET</h2>
        <p style={{ color: '#3b82f6', fontSize: '12px', marginTop: '5px', fontWeight: 'bold' }}>SIPENA KUNJUNGAN FISIK</p>
      </div>

      <div style={{ background: 'white', borderRadius: '25px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)' }}>
        <div style={{ padding: '30px', textAlign: 'center' }}>
          <div style={{ background: '#eff6ff', color: '#3b82f6', fontSize: '11px', fontWeight: 'bold', padding: '8px 20px', borderRadius: '20px', display: 'inline-block', marginBottom: '15px' }}>
            Lapas Kelas IIA Kerobokan
          </div>
          <h1 style={{ margin: 0, fontSize: '26px', color: '#0f172a' }}>{tiket.wbp}</h1>
          <p style={{ margin: '5px 0 0', color: '#64748b', fontSize: '14px' }}>Tujuan Kunjungan</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', margin: '0 -15px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0f172a' }}></div>
          <div style={{ flex: 1, borderBottom: '2px dashed #e2e8f0', margin: '0 10px' }}></div>
          <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#0f172a' }}></div>
        </div>

        <div style={{ padding: '25px' }}>
          {/* INFO UTAMA */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>TANGGAL</p>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{tiket.tanggal}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>SESI / JAM</p>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{tiket.sesi} ({tiket.jam})</p>
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>NOMOR ANTREAN</p>
              <p style={{ margin: 0, fontSize: '32px', color: '#3b82f6', fontWeight: '900' }}>{tiket.antrean}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8' }}>RINCIAN PERSONEL</p>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px' }}>Dewasa: {tiket.pengikut}</p>
              <p style={{ margin: 0, fontWeight: 'bold', fontSize: '12px' }}>Anak: {tiket.jumlah_anak || 0}</p>
              <p style={{ margin: 0, fontWeight: '900', color: '#3b82f6', fontSize: '14px' }}>Total: {parseInt(tiket.pengikut) + (parseInt(tiket.jumlah_anak) || 0)}</p>
            </div>
          </div>

          {/* TABEL DAFTAR NAMA PENGUNJUNG */}
          <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '15px', marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', fontWeight: 'bold', color: '#64748b', marginBottom: '10px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>Daftar Identitas Pengunjung</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tiket.detail_pengikut && tiket.detail_pengikut.map((p, index) => (
                <div key={index} style={{ background: '#f8fafc', padding: '10px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1e293b' }}>{p.nama}</span>
                    <span style={{ fontSize: '10px', color: '#3b82f6', fontWeight: 'bold', background: '#eff6ff', padding: '2px 8px', borderRadius: '10px' }}>
                      {index === 0 ? "UTAMA" : `PENGIKUT ${index}`}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '15px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>🆔 {p.nik}</span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>📞 {p.hp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ textAlign: 'center', padding: '20px', background: '#f8fafc', borderRadius: '20px', marginBottom: '10px' }}>
            <QRCode value={qrCodeValue} size={150} />
            <p style={{ margin: '10px 0 0', fontSize: '10px', color: '#94a3b8' }}>Scan QR Code ini di gerbang masuk</p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <button onClick={() => window.print()} style={{ width: '100%', padding: '16px', borderRadius: '15px', background: '#3b82f6', color: 'white', border: 'none', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>📥 SIMPAN TIKET (PDF/CETAK)</button>
        <button onClick={() => navigate('/history')} style={{ width: '100%', padding: '16px', borderRadius: '15px', background: 'transparent', color: '#94a3b8', border: '1px solid #475569', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer' }}>KEMBALI KE RIWAYAT</button>
      </div>

      <style>{`
        @media print { 
          body * { visibility: hidden; } 
          .app-container, .app-container * { visibility: visible; } 
          button { display: none !important; }
          .app-container { padding: 0 !important; margin: 0 !important; }
        }
      `}</style>
    </div>
  );
}