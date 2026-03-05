import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Kunjungan() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  
  const minDate = new Date().toLocaleDateString('en-CA'); 

  const [data, setData] = useState({ 
    pengikut: 1,
    anak: 0,
    tanggal: '', 
    sesi: '', 
    jam: '' 
  });
  const [pengikutDetail, setPengikutDetail] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingLibur, setCheckingLibur] = useState(false);

  useEffect(() => {
    if (!user) navigate("/login");
  }, [user, navigate]);

  useEffect(() => {
    const jumlah = parseInt(data.pengikut) || 0;
    const newDetails = Array.from({ length: jumlah }, (_, i) => {
      return pengikutDetail[i] || { nama: '', nik: '', alamat: '', hp: '' };
    });
    setPengikutDetail(newDetails);
  }, [data.pengikut]);

  const isWaktuHabis = (sesiTerpilih) => {
    const hariIni = new Date().toLocaleDateString('en-CA');
    if (data.tanggal !== hariIni) return false;

    const sekarang = new Date();
    const jamSekarang = sekarang.getHours();
    const menitSekarang = sekarang.getMinutes();
    const totalMenitSekarang = (jamSekarang * 60) + menitSekarang;

    if (sesiTerpilih === "Pagi") {
      return totalMenitSekarang > 690;
    } else if (sesiTerpilih === "Siang") {
      return totalMenitSekarang > 930;
    }
    return false;
  };

  const handleSesiChange = (e) => {
    const sesi = e.target.value;
    if (sesi && isWaktuHabis(sesi)) {
      alert(`⚠️ Mohon maaf, pendaftaran untuk Sesi ${sesi} hari ini sudah ditutup karena telah melewati batas waktu layanan.`);
      setData({ ...data, sesi: '', jam: '' });
      return;
    }
    setData({ ...data, sesi: sesi, jam: '' });
  };

  const checkLiburNasional = async (tanggalTerpilih) => {
    try {
      setCheckingLibur(true);
      const tahun = new Date(tanggalTerpilih).getFullYear();
      const response = await fetch(`https://api-harilibur.vercel.app/api?year=${tahun}`);
      const daftarLibur = await response.json();
      const hariLibur = daftarLibur.find(libur => libur.holiday_date === tanggalTerpilih);
      return hariLibur ? { isLibur: true, keterangan: hariLibur.holiday_name } : { isLibur: false };
    } catch (error) {
      return { isLibur: false }; 
    } finally {
      setCheckingLibur(false);
    }
  };

  const handleUpdatePengikut = (index, field, value) => {
    const updated = [...pengikutDetail];
    updated[index][field] = value;
    setPengikutDetail(updated);
  };

  const getJadwalByTanggal = (dateString) => {
    if (!dateString) return null;
    const days = ['MINGGU', 'SENIN', 'SELASA', 'RABU', 'KAMIS', 'JUMAT', 'SABTU'];
    const d = new Date(dateString);
    const hari = days[d.getDay()];
    const mapping = {
      'SENIN': ['YUDISTIRA A'],
      'SELASA': ['YUDISTIRA B'],
      'RABU': ['BIMA C'],
      'KAMIS': ['BIMA D'],
      'JUMAT': ['ARJUNA E', 'ARJUNA F', 'KLINIK', 'DAPUR']
    };
    return { namaHari: hari, daftarBlok: mapping[hari] || [] };
  };

  const handleTanggalChange = async (e) => {
    const tgl = e.target.value;
    if (!tgl) return;
    const day = new Date(tgl).getDay();
    if (day === 0 || day === 6) {
      alert("⚠️ Maaf, layanan TUTUP pada hari Sabtu & Minggu.");
      setData({ ...data, tanggal: "" });
      return;
    }
    const resLibur = await checkLiburNasional(tgl);
    if (resLibur.isLibur) {
      alert(`🚫 PENDAFTARAN DITUTUP\nKeterangan: ${resLibur.keterangan}`);
      setData({ ...data, tanggal: "" });
      return;
    }
    setData({ ...data, tanggal: tgl, sesi: '', jam: '' }); 
  };

  const handleSimpan = async (e) => {
    e.preventDefault();

    if (isWaktuHabis(data.sesi)) {
      return alert("⚠️ Maaf, waktu pendaftaran untuk sesi ini sudah berakhir. Silahkan pilih tanggal lain.");
    }

    const infoJadwal = getJadwalByTanggal(data.tanggal);
    const blokUser = user.blok_wbp?.toUpperCase().trim() || "";
    const isBolehKunjung = infoJadwal.daftarBlok.some(b => 
      blokUser.includes(b.toUpperCase()) || b.toUpperCase().includes(blokUser)
    );
    
    if (!isBolehKunjung) {
        return alert(`❌ Jadwal Blok ${blokUser} bukan hari ini.`);
    }

    setLoading(true);
    try {
      const prefixAntrean = blokUser.substring(0, 3).toUpperCase() || "KUN"; 
      const { count } = await supabase
        .from('kunjungan')
        .select('*', { count: 'exact', head: true })
        .eq('tanggal', data.tanggal)
        .ilike('antrean', `${prefixAntrean}%`);

      const nomorUrut = (count || 0) + 1;
      const antreanUnik = `${prefixAntrean}-${nomorUrut.toString().padStart(2, '0')}`;

      const payload = {
        user_id: user.id,
        nama_pengunjung: user.nama,
        wbp: user.wbp,
        kamar_wbp: user.kamar_wbp || '-',
        tanggal: data.tanggal,
        sesi: data.sesi,
        jam: data.jam,
        pengikut: parseInt(data.pengikut),
        jumlah_anak: parseInt(data.anak) || 0, 
        detail_pengikut: pengikutDetail, 
        antrean: antreanUnik,
        tipe: 'kunjungan', 
        status: 'pending'
      };

      const { data: insertedData, error } = await supabase
        .from('kunjungan')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      localStorage.setItem("tiket_aktif", JSON.stringify(insertedData));
      alert(`✅ Berhasil!\nNomor Antrean: ${antreanUnik}`);
      navigate("/tiket-kunjungan");
    } catch (err) {
      alert("Gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <div style={{ 
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        padding: 'clamp(24px, 4vw, 36px) clamp(20px, 4vw, 32px)',
        color: 'white',
        textAlign: 'center',
        borderRadius: '0 0 28px 28px',
        boxShadow: '0 8px 32px rgba(15, 23, 42, 0.4)'
      }}>
        <h1 style={{ 
          margin: 0,
          fontSize: 'clamp(20px, 4vw, 26px)',
          fontWeight: '800',
          fontFamily: '"Outfit", sans-serif',
          letterSpacing: '-0.5px'
        }}>
          Booking Kunjungan
        </h1>
        <p style={{ 
          margin: '6px 0 0',
          fontSize: 'clamp(12px, 2vw, 14px)',
          opacity: 0.85
        }}>
          Daftar kunjungan fisik ke Lapas
        </p>
      </div>

      <div style={{ 
        padding: 'clamp(16px, 3vw, 24px)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <form onSubmit={handleSimpan} className="form-card">
          
          {/* INFO WBP */}
          <div style={{ 
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            padding: 'clamp(16px, 3vw, 20px)',
            borderRadius: '18px',
            marginBottom: '28px',
            border: '2px solid #bfdbfe'
          }}>
            <div style={{ 
              fontSize: 'clamp(10px, 2vw, 11px)',
              color: '#1e40af',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '6px'
            }}>
              Tujuan Kunjungan:
            </div>
            <div style={{ 
              fontSize: 'clamp(16px, 3vw, 18px)',
              fontWeight: '800',
              color: '#0f172a',
              fontFamily: '"Outfit", sans-serif',
              marginBottom: '6px'
            }}>
              {user?.wbp}
            </div>
            <div style={{ 
              fontSize: 'clamp(12px, 2vw, 14px)',
              color: '#1e40af',
              fontWeight: '600'
            }}>
              Blok: <b>{user?.blok_wbp}</b> | Kamar: <b>{user?.kamar_wbp}</b>
            </div>
          </div>

          {/* TANGGAL */}
          <div style={{ marginBottom: '22px' }}>
            <label>📅 Pilih Tanggal Kunjungan</label>
            <input 
              type="date" 
              required 
              min={minDate} 
              value={data.tanggal} 
              onChange={handleTanggalChange}
            />
            {checkingLibur && (
              <p style={{ 
                fontSize: 'clamp(11px, 2vw, 12px)',
                color: '#3b82f6',
                marginTop: '8px',
                fontStyle: 'italic'
              }}>
                ⏳ Mengecek hari libur nasional...
              </p>
            )}
          </div>

          {/* SESI & JAM */}
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 'clamp(10px, 2vw, 14px)',
            marginBottom: '22px'
          }}>
            <div>
              <label style={{ marginTop: 0 }}>⏰ Sesi</label>
              <select 
                required 
                value={data.sesi} 
                onChange={handleSesiChange}
              >
                <option value="">Pilih Sesi</option>
                <option value="Pagi">Pagi</option>
                <option value="Siang">Siang</option>
              </select>
            </div>
            <div>
              <label style={{ marginTop: 0 }}>🕐 Jam</label>
              <select 
                required 
                value={data.jam} 
                onChange={e => setData({...data, jam: e.target.value})}
              >
                <option value="">Pilih Jam</option>
                {data.sesi === "Pagi" && <option value="09.00 - 11.30">09.00 - 11.30</option>}
                {data.sesi === "Siang" && <option value="13.00 - 14.30">13.00 - 14.30</option>}
              </select>
            </div>
          </div>

          {/* JUMLAH PENGIKUT DEWASA */}
          <div style={{ marginBottom: '22px' }}>
            <label>👥 Jumlah Pengikut Dewasa</label>
            <p style={{ 
              margin: '0 0 10px 0',
              fontSize: 'clamp(11px, 2vw, 12px)',
              color: '#3b82f6',
              fontStyle: 'italic'
            }}>
              *Minimal 1 (Termasuk Anda sendiri)
            </p>
            <input 
              type="number" 
              min="1" 
              max="5" 
              required 
              value={data.pengikut} 
              onChange={e => setData({...data, pengikut: e.target.value})} 
            />
          </div>

          {/* JUMLAH ANAK */}
          <div style={{ 
            marginBottom: '28px',
            padding: 'clamp(14px, 2.5vw, 18px)',
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
            borderRadius: '16px',
            border: '2px solid #fed7aa'
          }}>
            <label style={{ color: '#9a3412', marginTop: 0 }}>
              🧒 Membawa Anak Kecil?
            </label>
            <p style={{ 
              margin: '0 0 10px 0',
              fontSize: 'clamp(11px, 2vw, 12px)',
              color: '#c2410c'
            }}>
              Tanpa identitas - masukkan jumlah anak di bawah umur yang ikut
            </p>
            <input 
              type="number" 
              min="0" 
              max="10" 
              value={data.anak} 
              onChange={e => setData({...data, anak: e.target.value})}
              style={{ 
                background: 'white',
                border: '2px solid #fdba74'
              }}
            />
          </div>

          {/* DETAIL PENGIKUT */}
          {pengikutDetail.map((item, index) => (
            <div 
              key={index} 
              style={{ 
                padding: 'clamp(14px, 2.5vw, 18px)',
                marginBottom: '18px',
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '16px'
              }}
            >
              <p style={{ 
                margin: '0 0 14px 0',
                fontSize: 'clamp(11px, 2vw, 12px)',
                fontWeight: '700',
                color: '#3b82f6',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {index === 0 ? "📝 Data Pengunjung Utama (Anda)" : `👤 Data Pengikut #${index + 1}`}
              </p>
              <div style={{ marginBottom: '12px' }}>
                <input 
                  placeholder="Nama Lengkap" 
                  required 
                  value={item.nama} 
                  onChange={e => handleUpdatePengikut(index, 'nama', e.target.value)}
                  style={{ marginTop: '0' }}
                />
              </div>
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '12px'
              }}>
                <input 
                  placeholder="NIK (16 digit)" 
                  required 
                  maxLength="16" 
                  value={item.nik} 
                  onChange={e => handleUpdatePengikut(index, 'nik', e.target.value)}
                  style={{ marginTop: '0' }}
                />
                <input 
                  placeholder="No. HP" 
                  required 
                  value={item.hp} 
                  onChange={e => handleUpdatePengikut(index, 'hp', e.target.value)}
                  style={{ marginTop: '0' }}
                />
              </div>
            </div>
          ))}

          {/* SUBMIT BUTTON */}
          <button 
            type="submit" 
            disabled={loading} 
            className="btn-full"
            style={{ margin: '28px 0 0 0', width: '100%' }}
          >
            {loading ? "⏳ Memproses..." : "✓ Konfirmasi Pendaftaran"}
          </button>
        </form>

        {/* BACK TO DASHBOARD */}
        <Link 
          to="/dashboard" 
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
      </div>
    </div>
  );
}