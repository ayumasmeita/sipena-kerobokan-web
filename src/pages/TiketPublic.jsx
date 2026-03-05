import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function TiketPublic() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: res } = await supabase.from('kunjungan').select('*').eq('id', id).single();
      
      // LOGIKA ADMIN: Jika antrean belum ada, buatkan dan update status
      if (res && !res.antrean) {
        const nextAntrean = "A-" + Math.floor(Math.random() * 900 + 100);
        await supabase.from('kunjungan').update({ antrean: nextAntrean, status: 'selesai' }).eq('id', id);
        res.antrean = nextAntrean;
        res.status = 'selesai';
      }
      
      setData(res);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div style={{textAlign:'center', marginTop:'50px', fontFamily:'sans-serif'}}>Memproses...</div>;
  if (!data) return <div style={{textAlign:'center', marginTop:'50px', fontFamily:'sans-serif'}}>Tiket Tidak Valid!</div>;

  return (
    <div className="admin-container" style={{ maxWidth: '320px', margin: 'auto', padding: '15px', fontFamily: 'Inter, sans-serif', background: '#f1f5f9', minHeight: '100vh' }}>
      
      {/* TOMBOL CETAK */}
      <div className="no-print" style={{ marginBottom: '20px' }}>
        <button onClick={() => window.print()} style={{ width: '100%', padding: '15px', background: '#22c55e', color: 'white', border: 'none', fontWeight: 'bold', borderRadius: '12px', cursor: 'pointer', fontSize: '15px' }}>
          🖨️ CETAK STRUK BESUKAN
        </button>
      </div>

      {/* TAMPILAN STRUK */}
      <div style={{ border: '1px solid #e2e8f0', padding: '20px', background: 'white', borderRadius: '16px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <div style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '2px solid #0f172a', paddingBottom: '10px' }}>
            <h3 style={{ margin: '0', fontSize: '18px', fontWeight: '800' }}>LAPAS KEROBOKAN</h3>
            <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#64748b' }}>Struk Kunjungan Fisik</p>
        </div>
        
        <div style={{ textAlign: 'center' }}>
            <p style={{margin: '0', fontSize: '12px', color: '#64748b'}}>Nomor Antrean</p>
            <div style={{ fontSize: '48px', fontWeight: '800', margin: '5px 0', color: '#0f172a' }}>
              {data.antrean}
            </div>
        </div>

        <div style={{ fontSize: '13px', borderTop: '1px dashed #cbd5e1', paddingTop: '15px', marginTop: '15px', lineHeight: '1.8' }}>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>Nama</span><strong style={{textAlign:'right'}}>{data.nama_pengunjung}</strong></div>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>WBP</span><strong style={{textAlign:'right'}}>{data.wbp}</strong></div>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>Tgl</span><strong>{data.tanggal}</strong></div>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>Sesi</span><strong>{data.sesi}</strong></div>
          <div style={{display:'flex', justifyContent:'space-between'}}><span>Jam</span><strong>{data.jam}</strong></div>
        </div>
        
        <div style={{textAlign:'center', marginTop:'20px', fontSize:'11px', color: '#94a3b8', borderTop: '1px solid #f1f5f9', paddingTop: '10px'}}>
            <p style={{margin:0}}>SIPENA Kunjungan Fisik</p>
            <p style={{margin:0}}>{new Date().toLocaleString()}</p>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .admin-container, .admin-container * { visibility: visible; }
          .admin-container { position: absolute; left: 0; top: 0; width: 100%; padding: 0 !important; background: white !important;}
          .no-print { display: none !important; }
          .admin-container { border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}