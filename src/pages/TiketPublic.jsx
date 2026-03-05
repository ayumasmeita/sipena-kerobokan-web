import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function TiketPublic() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: res } = await supabase.from('kunjungan').select('*').eq('id', id).single();
      
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: '"Manrope", sans-serif',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '18px', fontWeight: '600' }}>Memuat tiket...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: '"Manrope", sans-serif',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: 'white',
        padding: '20px'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
          <div style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>Tiket Tidak Valid</div>
          <div style={{ fontSize: '14px', opacity: 0.8 }}>ID tiket tidak ditemukan dalam sistem</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      maxWidth: '420px',
      margin: 'auto',
      padding: 'clamp(16px, 3vw, 24px)',
      fontFamily: '"Manrope", sans-serif',
      background: '#f1f5f9',
      minHeight: '100vh'
    }}>
      
      {/* TOMBOL CETAK */}
      <div className="no-print" style={{ marginBottom: '24px' }}>
        <button 
          onClick={() => window.print()}
          style={{ 
            width: '100%',
            padding: 'clamp(14px, 2.5vw, 18px)',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: 'white',
            border: 'none',
            fontWeight: '800',
            borderRadius: '16px',
            cursor: 'pointer',
            fontSize: 'clamp(14px, 2.5vw, 16px)',
            fontFamily: '"Outfit", sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 12px 32px rgba(16, 185, 129, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 24px rgba(16, 185, 129, 0.3)';
          }}
        >
          🖨️ Cetak Struk Kunjungan
        </button>
      </div>

      {/* TAMPILAN STRUK */}
      <div className="ticket" style={{
        border: '2px solid #e2e8f0',
        padding: 'clamp(20px, 4vw, 28px)',
        background: 'white',
        borderRadius: '24px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
      }}>
        {/* HEADER STRUK */}
        <div style={{ 
          textAlign: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '3px solid #0f172a'
        }}>
          <h3 style={{ 
            margin: '0',
            fontSize: 'clamp(18px, 3.5vw, 22px)',
            fontWeight: '800',
            fontFamily: '"Outfit", sans-serif',
            color: '#0f172a',
            letterSpacing: '-0.5px'
          }}>
            LAPAS KEROBOKAN
          </h3>
          <p style={{ 
            margin: '6px 0 0',
            fontSize: 'clamp(12px, 2vw, 13px)',
            color: '#64748b',
            fontWeight: '600'
          }}>
            Struk Kunjungan Fisik
          </p>
        </div>
        
        {/* NOMOR ANTREAN */}
        <div style={{ 
          textAlign: 'center',
          padding: '24px 16px',
          background: 'linear-gradient(135deg, #eff6ff, #dbeafe)',
          borderRadius: '20px',
          marginBottom: '20px',
          border: '2px solid #bfdbfe'
        }}>
          <p style={{
            margin: '0 0 8px 0',
            fontSize: 'clamp(11px, 2vw, 12px)',
            color: '#1e40af',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.8px'
          }}>
            Nomor Antrean
          </p>
          <div style={{ 
            fontSize: 'clamp(48px, 10vw, 72px)',
            fontWeight: '900',
            margin: '8px 0',
            color: '#0f172a',
            fontFamily: '"Outfit", sans-serif',
            letterSpacing: '-2px',
            lineHeight: 1
          }}>
            {data.antrean}
          </div>
        </div>

        {/* DETAIL TIKET */}
        <div style={{ 
          fontSize: 'clamp(13px, 2.5vw, 14px)',
          borderTop: '2px dashed #cbd5e1',
          paddingTop: '20px',
          marginTop: '20px',
          lineHeight: '2'
        }}>
          <div className="ticket-row" style={{
            display:'flex',
            justifyContent:'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '10px'
          }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Nama</span>
            <strong style={{
              textAlign:'right',
              color: '#0f172a',
              fontWeight: '700',
              maxWidth: '60%'
            }}>
              {data.nama_pengunjung}
            </strong>
          </div>
          <div className="ticket-row" style={{
            display:'flex',
            justifyContent:'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            marginBottom: '10px'
          }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>WBP</span>
            <strong style={{
              textAlign:'right',
              color: '#0f172a',
              fontWeight: '700',
              maxWidth: '60%'
            }}>
              {data.wbp}
            </strong>
          </div>
          <div className="ticket-row" style={{
            display:'flex',
            justifyContent:'space-between',
            gap: '12px',
            marginBottom: '10px'
          }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Tanggal</span>
            <strong style={{ color: '#0f172a', fontWeight: '700' }}>{data.tanggal}</strong>
          </div>
          <div className="ticket-row" style={{
            display:'flex',
            justifyContent:'space-between',
            gap: '12px',
            marginBottom: '10px'
          }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Sesi</span>
            <strong style={{ color: '#0f172a', fontWeight: '700' }}>{data.sesi}</strong>
          </div>
          <div className="ticket-row" style={{
            display:'flex',
            justifyContent:'space-between',
            gap: '12px'
          }}>
            <span style={{ color: '#64748b', fontWeight: '600' }}>Jam</span>
            <strong style={{ color: '#0f172a', fontWeight: '700' }}>{data.jam}</strong>
          </div>
        </div>
        
        {/* FOOTER */}
        <div style={{
          textAlign:'center',
          marginTop:'24px',
          fontSize: 'clamp(10px, 2vw, 11px)',
          color: '#94a3b8',
          borderTop: '1px solid #f1f5f9',
          paddingTop: '16px'
        }}>
          <p style={{margin:'0 0 4px 0', fontWeight: '600'}}>SIPENA - Sistem Kunjungan Online</p>
          <p style={{margin:0}}>{new Date().toLocaleString('id-ID')}</p>
        </div>
      </div>

      {/* BACK BUTTON */}
      <Link 
        to="/dashboard"
        className="no-print"
        style={{ 
          display: 'block',
          textAlign: 'center',
          marginTop: '20px',
          color: '#64748b',
          textDecoration: 'none',
          fontSize: 'clamp(13px, 2.5vw, 14px)',
          fontWeight: '600',
          transition: 'color 0.3s ease'
        }}
        onMouseOver={(e) => e.target.style.color = '#3b82f6'}
        onMouseOut={(e) => e.target.style.color = '#64748b'}
      >
        ← Kembali ke Dashboard
      </Link>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .ticket, .ticket * { visibility: visible; }
          .ticket { 
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            border-radius: 0 !important;
          }
          .no-print { display: none !important; }
          .ticket-row {
            page-break-inside: avoid;
          }
        }
      `}</style>
    </div>
  );
}