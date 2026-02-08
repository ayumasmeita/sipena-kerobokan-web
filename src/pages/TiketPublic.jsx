import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
// Pastikan logo ini ada di folder src/
import logoKemenimipas from '../logo-kemenimipas.png';

export default function TiketPublic() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Mengambil data kunjungan berdasarkan ID dari QR Code
      const { data: res } = await supabase
        .from('kunjungan')
        .select('*')
        .eq('id', id)
        .single();
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="public-container">Memverifikasi Tiket...</div>;
  if (!data) return <div className="public-container">Tiket Tidak Valid!</div>;

  return (
    <div className="public-container">
      {/* Tombol cetak untuk Admin, disembunyikan saat dicetak */}
      <div className="no-print admin-action-wrapper">
        <button onClick={() => window.print()} className="print-btn">
          🖨️ CETAK STRUK BESUKAN
        </button>
      </div>

      <div className="ticket-mewah">
        <div className="ticket-badge">E-TIKET</div>
        
        {/* KOP RESMI */}
        <div className="kop-resmi">
          <img src={logoKemenimipas} alt="Logo" className="logo-kemen"/>
          <div className="text-kop">
            <h5>KEMENTERIAN IMIGRASI & PEMASYARAKATAN RI</h5>
            <h4>LAPAS KELAS IIA KEROBOKAN</h4>
          </div>
        </div>

        <div className={`status-banner ${data.status === 'selesai' ? 'done' : 'pending'}`}>
          {data.status === 'selesai' ? '✅ TIKET SUDAH DIGUNAKAN' : '⚠️ TIKET VALID / AKTIF'}
        </div>

        <div className="ticket-body-mewah">
          <div className="info-row antrean-box">
            <span>Nomor Antrean</span>
            <strong className="antrean-highlight">{data.antrean}</strong>
          </div>
          
          <div className="info-row">
            <span>WBP / Kamar</span>
            <strong>{data.wbp} ({data.kamar_wbp})</strong>
          </div>
          
          <div className="info-row">
            <span>Jadwal</span>
            <strong>{data.tanggal} | {data.jam}</strong>
          </div>

          <div className="info-row">
            <span>Pengunjung Utama</span>
            <strong>{data.nama_pengunjung}</strong>
          </div>

          {/* Rincian Personel Lengkap */}
          <div className="detail-pengikut-section">
            <div className="info-row">
              <span>Dewasa (Termasuk Utama)</span>
              <strong>{data.pengikut} Orang</strong>
            </div>
            <div className="info-row">
              <span>Anak / Bayi</span>
              <strong>{data.jumlah_anak || 0} Orang</strong>
            </div>
            <div className="info-row total-box">
              <span>TOTAL PERSONEL</span>
              <strong>{parseInt(data.pengikut) + (parseInt(data.jumlah_anak) || 0)} Orang</strong>
            </div>
          </div>

          {/* Daftar Identitas Lengkap Pengikut */}
          <div className="identitas-list">
            <p className="section-title">DAFTAR IDENTITAS</p>
            {data.detail_pengikut && data.detail_pengikut.map((p, i) => (
              <div key={i} className="identitas-item">
                <span className="nama-p">{i+1}. {p.nama}</span>
                <span className="nik-p">NIK: {p.nik} | HP: {p.hp}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ticket-footer-mewah">
          <p>Sistem Informasi Pendaftaran Kunjungan (SIPENA)</p>
          <small>ID: {data.id} • Diverifikasi: {new Date().toLocaleString('id-ID')}</small>
        </div>
      </div>

      {/* CSS Khusus untuk Tampilan dan Cetak Thermal */}
      <style dangerouslySetInnerHTML={{ __html: `
        .public-container {
          background: #f1f5f9;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-start;
          align-items: center;
          padding: 20px;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .admin-action-wrapper { margin-bottom: 20px; }
        .print-btn {
          background: #22c55e;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 800;
          cursor: pointer;
          font-size: 14px;
        }

        .ticket-mewah {
          background: white;
          width: 100%;
          max-width: 400px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 10px 25px rgba(0,0,0,0.1);
          position: relative;
        }

        .ticket-badge {
          background: #facc15;
          color: #854d0e;
          font-size: 9px;
          font-weight: 800;
          padding: 4px 15px;
          position: absolute;
          top: 10px;
          right: -15px;
          transform: rotate(45deg);
          width: 80px;
          text-align: center;
          z-index: 10;
        }

        .kop-resmi {
          display: flex;
          align-items: center;
          padding: 15px;
          border-bottom: 1px solid #e2e8f0;
          gap: 10px;
        }

        .logo-kemen { width: 35px; height: auto; }
        .text-kop h5 { margin: 0; font-size: 8px; color: #64748b; }
        .text-kop h4 { margin: 0; font-size: 11px; color: #1e293b; font-weight: 800; }

        .status-banner { padding: 8px; text-align: center; font-weight: 700; font-size: 10px; }
        .status-banner.pending { background: #ecfdf5; color: #059669; }
        .status-banner.done { background: #fef2f2; color: #dc2626; }

        .ticket-body-mewah { padding: 15px; }
        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px dashed #e2e8f0;
          font-size: 12px;
        }
        .info-row span { color: #64748b; }
        .info-row strong { color: #1e293b; font-weight: 700; }
        
        .antrean-box { border: none; background: #eff6ff; padding: 10px; border-radius: 8px; justify-content: center; gap: 10px;}
        .antrean-highlight { font-size: 20px; color: #2563eb; }

        .total-box { border: 1px solid #e2e8f0; padding: 8px; background: #f8fafc; border-radius: 4px; }
        
        .identitas-list { margin-top: 15px; }
        .section-title { font-size: 10px; color: #94a3b8; font-weight: 800; margin: 0 0 5px 0; }
        .identitas-item { 
          background: #f8fafc; 
          padding: 6px; 
          border-radius: 4px; 
          margin-bottom: 4px; 
          display: flex;
          flex-direction: column;
          font-size: 10px;
        }
        .nama-p { font-weight: 700; color: #1e293b; }
        .nik-p { color: #64748b; }

        .ticket-footer-mewah {
          padding: 10px;
          background: #f1f5f9;
          text-align: center;
          font-size: 8px;
          color: #64748b;
        }
        .ticket-footer-mewah p { margin: 0; font-weight: 700; color: #1e293b; }

        /* LOGIKA PRINT: HANYA STRUK YANG DICETAK */
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .public-container { padding: 0 !important; background: white !important; }
          .ticket-mewah { box-shadow: none !important; width: 100% !important; max-width: 100% !important; }
        }
      `}} />
    </div>
  );
}