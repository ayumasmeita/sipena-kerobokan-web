import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export default function Kunjungan() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  
  const minDate = new Date().toLocaleDateString('en-CA'); 

  const [data, setData] = useState({ 
    pengikut: 1, // Dewasa (termasuk diri sendiri)
    anak: 0,     // Jumlah anak (input manual baru)
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

  // --- LOGIKA TAMBAHAN: CEK BATAS WAKTU PENDAFTARAN ---
  const isWaktuHabis = (sesiTerpilih) => {
    const hariIni = new Date().toLocaleDateString('en-CA');
    
    // Validasi hanya berlaku jika memilih tanggal hari ini
    if (data.tanggal !== hariIni) return false;

    const sekarang = new Date();
    const jamSekarang = sekarang.getHours();
    const menitSekarang = sekarang.getMinutes();
    const totalMenitSekarang = (jamSekarang * 60) + menitSekarang;

    if (sesiTerpilih === "Pagi") {
      // Batas pendaftaran sesi pagi: 11:30 (11*60 + 30 = 690 menit)
      return totalMenitSekarang > 690;
    } else if (sesiTerpilih === "Siang") {
      // Batas pendaftaran sesi siang: 15:30 (15*60 + 30 = 930 menit)
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

    // Validasi ulang jam sebelum insert ke database
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
    <div className="app-container" style={{ maxWidth: '500px', margin: 'auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '30px' }}>
      <div style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)', padding: '30px 20px', color: 'white', borderRadius: '0 0 25px 25px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>BOOKING KUNJUNGAN</h1>
      </div>

      <div style={{ padding: '20px' }}>
        <form onSubmit={handleSimpan} style={{ background: 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 10px 15px rgba(0,0,0,0.1)' }}>
          
          <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '15px', marginBottom: '25px', border: '1px solid #bae6fd' }}>
            <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 'bold' }}>TUJUAN KUNJUNGAN:</div>
            <div style={{ fontSize: '15px', fontWeight: '800', color: '#0c4a6e' }}>{user?.wbp}</div>
            <div style={{ fontSize: '13px', color: '#0369a1' }}>Blok: <b>{user?.blok_wbp}</b> | Kamar: <b>{user?.kamar_wbp}</b></div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '8px' }}>📅 Pilih Tanggal</label>
            <input type="date" required min={minDate} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }} value={data.tanggal} onChange={handleTanggalChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '15px' }}>
            <select required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0' }} value={data.sesi} onChange={handleSesiChange}>
                <option value="">Sesi</option>
                <option value="Pagi">Pagi</option>
                <option value="Siang">Siang</option>
            </select>
            <select required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '2px solid #e2e8f0' }} value={data.jam} onChange={e => setData({...data, jam: e.target.value})}>
                <option value="">Jam</option>
                {data.sesi === "Pagi" && <option value="09.00 - 11.30">09.00 - 11.30</option>}
                {data.sesi === "Siang" && <option value="13.00 - 14.30">13.00 - 14.30</option>}
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#475569', marginBottom: '4px' }}>👥 Jumlah Pengikut Dewasa</label>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#3b82f6', fontStyle: 'italic' }}>*Minimal 1 (Termasuk Anda sendiri)</p>
            <input type="number" min="1" max="5" required style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #e2e8f0', boxSizing: 'border-box' }} value={data.pengikut} onChange={e => setData({...data, pengikut: e.target.value})} />
          </div>

          <div style={{ marginBottom: '25px', padding: '15px', background: '#fff7ed', borderRadius: '15px', border: '1px solid #ffedd5' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#9a3412', marginBottom: '4px' }}>🧒 Membawa Anak Kecil? (Tanpa Identitas)</label>
            <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#c2410c' }}>Masukkan jumlah anak di bawah umur yang ikut.</p>
            <input type="number" min="0" max="10" style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #fed7aa', boxSizing: 'border-box' }} value={data.anak} onChange={e => setData({...data, anak: e.target.value})} />
          </div>

          {pengikutDetail.map((item, index) => (
            <div key={index} style={{ padding: '15px', marginBottom: '15px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '15px' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px', fontWeight: 'bold', color: '#2563eb' }}>
                {index === 0 ? "DATA PENGUNJUNG UTAMA (ANDA)" : `DATA PENGIKUT #${index + 1}`}
              </p>
              <input placeholder="Nama Lengkap" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', marginBottom: '10px', boxSizing: 'border-box' }} value={item.nama} onChange={e => handleUpdatePengikut(index, 'nama', e.target.value)} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <input placeholder="NIK" required maxLength="16" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={item.nik} onChange={e => handleUpdatePengikut(index, 'nik', e.target.value)} />
                <input placeholder="No. HP" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }} value={item.hp} onChange={e => handleUpdatePengikut(index, 'hp', e.target.value)} />
              </div>
            </div>
          ))}

          <button type="submit" disabled={loading} style={{ width: '100%', padding: '18px', borderRadius: '15px', border: 'none', background: '#2563eb', color: 'white', fontWeight: '800' }}>
            {loading ? "MEMPROSES..." : "KONFIRMASI PENDAFTARAN"}
          </button>
        </form>
      </div>
    </div>
  );
}