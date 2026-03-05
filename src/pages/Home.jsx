import { Link } from 'react-router-dom';
import logoKemenimipas from '../logo-kemenimipas.png';

export default function Home() {
  return (
    <div className="app">
      {/* HEADER */}
      <div className="app-header">
        <div className="logo">
          <img 
            src={logoKemenimipas} 
            alt="Logo Kemenimipas" 
            style={{ width: 'clamp(60px, 12vw, 90px)', height: 'auto' }} 
          />
        </div>
        <div>
          <h1>SIPENA KEROBOKAN</h1>
          <p>Lapas Kelas IIA Kerobokan</p>
        </div>
      </div>

      {/* HERO */}
      <div className="hero-card">
        <h2>Selamat Datang</h2>
        <p>
          Sistem Informasi Pendaftaran Kunjungan & Penitipan Online  
          Lapas Kelas IIA Kerobokan.
        </p>
        <div className="hero-actions">
          <Link to="/login" className="btn-outline">➜ Masuk</Link>
          <Link to="/register" className="btn-primary">👤 Registrasi</Link>
        </div>
      </div>

      {/* GRID CONTAINER FOR DESKTOP */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 'clamp(16px, 3vw, 24px)',
        padding: '0 clamp(16px, 3vw, 24px)',
        maxWidth: '1000px',
        margin: '0 auto'
      }}>
        {/* JAM LAYANAN */}
        <div className="info-card" style={{ margin: 0 }}>
          <div className="info-title">⏰ Jam Layanan</div>
          <div className="info-row">
            <span>Sesi Pagi</span>
            <b>09.00 – 11.30 WITA</b>
          </div>
          <div className="info-row">
            <span>Sesi Siang</span>
            <b>13.00 – 14.30 WITA</b>
          </div>
          <small className="note">
            * Senin s/d Jumat. Hari Sabtu, Minggu & Libur Nasional TUTUP.
          </small>
        </div>

        {/* JADWAL BLOK */}
        <div className="info-card" style={{ margin: 0 }}>
          <div className="info-title">📅 Jadwal Blok</div>
          <hr style={{ margin: '12px 0', border: 'none', borderTop: '1px solid #eee' }} />
          
          <div className="info-row">
            <span>Senin</span>
            <b className="blok yudis">Yudistira A</b>
          </div>
          <div className="info-row">
            <span>Selasa</span>
            <b className="blok yudis">Yudistira B</b>
          </div>
          <div className="info-row">
            <span>Rabu</span>
            <b className="blok bima">Bima C</b>
          </div>
          <div className="info-row">
            <span>Kamis</span>
            <b className="blok bima">Bima D</b>
          </div>
          <div className="info-row">
            <span>Jumat</span>
            <b className="blok arjuna">Arjuna E, F, Klinik & Dapur</b>
          </div>
        </div>
      </div>

      {/* BUTTON MULAI */}
      <Link to="/login" className="btn-full">
        ➜ Mulai Layanan
      </Link>
    </div>
  );
}