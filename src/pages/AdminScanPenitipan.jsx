import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import QRCode from "react-qr-code";
// Pastikan logo ini ada di folder src/
import logoKemenimipas from '../logo-kemenimipas.png'; 

export default function AdminScanPenitipan() {
  const { id } = useParams(); // Mengambil ID dari URL (/verify/penitipan/ID)
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      // Mengambil data langsung dari Supabase berdasarkan ID QR
      const { data: res, error: fetchError } = await supabase
        .from('penitipan') // Pastikan nama tabel di Supabase adalah 'penitipan'
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError || !res) {
        setError("Data penitipan tidak ditemukan.");
      } else {
        setData(res);
      }
      setLoading(false);
    };
    if (id) fetchData();
  }, [id]);

  if (loading) return <div className="p-4 text-center">Memverifikasi Tiket...</div>;
  
  if (error || !data) {
    return (
      <div className="p-4 text-center text-red-600">
        <p>{error || "Tiket Tidak Valid"}</p>
        <button onClick={() => navigate("/dashboard")} className="mt-4 bg-blue-500 text-white p-2 rounded">
          Kembali ke Dashboard
        </button>
      </div>
    );
  }

  // URL untuk QR Code yang ada di dalam tiket
  const qrCodeValue = `${window.location.origin}/verify/penitipan/${data.id}`;

  return (
    <div className="admin-container" style={{ background: '#064e3b', minHeight: '100vh', padding: '20px', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Tombol Cetak - Hilang saat di-print */}
      <div className="no-print p-4 flex justify-center" style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => window.print()} 
          className="bg-white text-green-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2"
          style={{ cursor: 'pointer', border: 'none', fontSize: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        >
          🖨️ CETAK STRUK PENITIPAN
        </button>
      </div>

      {/* TAMPILAN TIKET (SESUAI SCREENSHOT) */}
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
          <h2 style={{ color: 'white', margin: 0, fontSize: '16px', fontWeight: '800' }}>E-TIKET PENITIPAN</h2>
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
              {data.nama_wbp}
            </h1>
          </div>

          {/* QR CODE SECTION */}
          <div style={{ textAlign: 'center', marginBottom: '25px' }}>
            <div style={{ display: 'inline-block', padding: '12px', border: '1px solid #f1f5f9', borderRadius: '20px', background: 'white' }}>
              <QRCode value={qrCodeValue} size={150} level="H" />
            </div>
            <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '10px', fontFamily: 'monospace', fontWeight: 'bold' }}>ID: {data.id.substring(0,8).toUpperCase()}</p>
          </div>

          <hr style={{ border: 'none', borderTop: '2px dashed #f1f5f9', margin: '20px 0' }} />

          {/* INFORMASI PENITIP & TANGGAL */}
          <div style={{ marginBottom: '25px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Penitip</span>
              <b style={{ color: '#1e293b', fontSize: '14px' }}>{data.nama_penitip}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f8fafc' }}>
              <span style={{ color: '#64748b', fontSize: '13px', fontWeight: '600' }}>Tanggal Titip</span>
              <b style={{ color: '#1e293b', fontSize: '14px' }}>
                {new Date(data.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </b>
            </div>
          </div>

          {/* NOMOR ANTREAN JUMBO */}
          <div style={{ textAlign: 'center', background: '#ecfdf5', padding: '15px', borderRadius: '20px', border: '1px solid #d1fae5' }}>
            <span style={{ color: '#059669', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>NOMOR ANTREAN</span>
            <div style={{ fontSize: '65px', fontWeight: '900', color: '#059669', lineHeight: '1', marginTop: '5px' }}>
              {data.antrean}
            </div>
          </div>

          {/* KETERANGAN BARANG */}
          <div style={{ marginTop: '20px', padding: '12px', background: '#f8fafc', borderRadius: '12px', borderLeft: '4px solid #10b981' }}>
            <p style={{ margin: 0, fontSize: '10px', color: '#94a3b8', fontWeight: 'bold' }}>KET. BARANG:</p>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#475569', fontWeight: '600', lineHeight: '1.4' }}>
              {data.deskripsi_barang}
            </p>
          </div>

        </div>

        {/* FOOTER INFO */}
        <div style={{ background: '#059669', padding: '12px', textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '11px', color: 'white', fontWeight: '700' }}>
              DATA TERVERIFIKASI SIPENA
            </p>
        </div>
      </div>

      {/* ACTION BUTTONS (TIDAK DICETAK) */}
      <div style={{ padding: '25px 0', maxWidth: '400px', margin: 'auto' }} className="no-print">
        <button 
          onClick={() => navigate("/dashboard")}
          style={{ 
            width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #6ee7b7', 
            background: 'transparent', color: '#6ee7b7', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px'
          }}
        >
          SELESAI / KEMBALI
        </button>
      </div>

      {/* PRINT CSS - MENGATUR TAMPILAN SAAT PRINT */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .admin-container { background: white !important; padding: 0 !important; }
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