import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import logoKemenimipas from '../logo-kemenimipas.png';

export default function TiketPublicPenitipan() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: res } = await supabase
        .from('kunjungan')
        .select('*')
        .eq('id', id)
        .eq('tipe', 'penitipan') // Memastikan hanya mengambil data penitipan
        .single();
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  // Fungsi untuk memicu print browser
  const handlePrint = () => {
    window.print();
  };

  if (loading) return <div className="public-container">Memverifikasi Barcode Barang...</div>;
  if (!data) return <div className="public-container">Data Penitipan Tidak Ditemukan!</div>;

  return (
    <div className="public-container">
      {/* Tombol Cetak - disembunyikan saat print */}
      <button 
        onClick={handlePrint}
        className="print-button no-print"
      >
        📥 CETAK TIKET
      </button>

      <div className="ticket-mewah border-hijau">
        <div className="ticket-badge badge-hijau">E-PENITIPAN</div>
        
        {/* KOP RESMI */}
        <div className="kop-resmi">
          <img 
            src={logoKemenimipas} 
            alt="Logo Kemenimipas" 
            className="logo-kemen"
          />
          <div className="text-kop">
            <h5>KEMENTERIAN IMIGRASI & PEMASYARAKATAN RI</h5>
            <h4>LAPAS KELAS IIA KEROBOKAN</h4>
          </div>
        </div>

        <div className={`status-banner ${data.status === 'selesai' ? 'done' : 'pending-hijau'}`}>
          {data.status === 'selesai' ? '✅ BARANG SUDAH DITERIMA' : '📦 BARANG SIAP DIANTARKAN'}
        </div>

        <div className="ticket-body-mewah">
          <div className="info-row">
            <span>Nomor Antrean</span>
            <strong className="antrean-highlight-hijau">{data.antrean}</strong>
          </div>
          <div className="info-row">
            <span>Nama Penitip</span>
            <strong>{data.nama_pengunjung}</strong>
          </div>
          <div className="info-row">
            <span>WBP Tujuan</span>
            <strong>{data.wbp} ({data.kamar_wbp})</strong>
          </div>
          <div className="info-row">
            <span>Tanggal Masuk</span>
            <strong>{data.tanggal}</strong>
          </div>
          <div className="info-row" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
            <span>Rincian Barang</span>
            <div className="box-keterangan">{data.keterangan || "Tidak ada rincian"}</div>
          </div>
        </div>

        <div className="ticket-footer-mewah">
          <p>Sistem Informasi Penitipan Barang (SIPENA)</p>
          <small>ID: {data.id} • Scan otomatis oleh Petugas Lapas</small>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .public-container {
          background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          font-family: 'Inter', sans-serif;
        }

        .ticket-mewah {
          background: white;
          width: 100%;
          max-width: 380px;
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
        }

        .border-hijau { border-top: 8px solid #10b981; }

        .ticket-badge {
          font-size: 10px;
          font-weight: 800;
          padding: 6px 20px;
          position: absolute;
          top: 18px;
          right: -25px;
          transform: rotate(45deg);
          width: 120px;
          text-align: center;
          z-index: 10;
        }

        .badge-hijau { background: #10b981; color: white; }

        .kop-resmi {
          display: flex;
          align-items: center;
          padding: 30px 20px;
          background: white;
          border-bottom: 4px double #e2e8f0;
          gap: 15px;
        }

        .logo-kemen { width: 50px; height: auto; }

        .text-kop h5 { margin: 0; font-size: 9px; color: #64748b; font-weight: 600; }
        .text-kop h4 { margin: 2px 0 0 0; font-size: 13px; color: #1e293b; font-weight: 800; }

        .status-banner { padding: 12px; text-align: center; font-weight: 700; font-size: 12px; }
        .status-banner.pending-hijau { background: #ecfdf5; color: #065f46; border-bottom: 1px solid #a7f3d0; }
        .status-banner.done { background: #fef2f2; color: #991b1b; border-bottom: 1px solid #fecaca; }

        .ticket-body-mewah { padding: 25px; background: white; }

        .info-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px dashed #e2e8f0;
          padding: 12px 0;
        }

        .info-row span { color: #64748b; font-size: 12px; font-weight: 500; }
        .info-row strong { color: #1e293b; font-size: 14px; font-weight: 700; }
        
        .antrean-highlight-hijau {
          font-size: 24px !important;
          color: #059669 !important;
          background: #f0fdf4;
          padding: 4px 12px;
          border-radius: 8px;
        }

        .box-keterangan {
          background: #f8fafc;
          padding: 10px;
          border-radius: 8px;
          font-size: 12px;
          color: #475569;
          width: 100%;
          border: 1px solid #e2e8f0;
        }

        .ticket-footer-mewah {
          padding: 20px;
          background: #f8fafc;
          text-align: center;
          border-top: 1px solid #e2e8f0;
        }

        .ticket-footer-mewah p { margin: 0; font-size: 10px; font-weight: 700; color: #1e293b; }
        .ticket-footer-mewah small { font-size: 9px; color: #94a3b8; }

        /* Tombol Cetak */
        .print-button {
          background: #10b981;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: bold;
          cursor: pointer;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          transition: 0.2s;
        }
        .print-button:hover { background: #059669; }

        /* Media Query untuk Print */
        @media print {
          .no-print {
            display: none !important;
          }
          .public-container {
            background: white !important;
            padding: 0 !important;
          }
          .ticket-mewah {
            box-shadow: none !important;
            border: 1px solid #ccc !important;
          }
        }
      `}} />
    </div>
  );
}