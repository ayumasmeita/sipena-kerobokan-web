import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import wbpRawData from '../wbp.json'; 

export default function Penitipan() {
  const [form, setForm] = useState({ jenis: '', jumlah: '', tanggal: '', ket: '' });
  const [loading, setLoading] = useState(false);
  const [checkingLibur, setCheckingLibur] = useState(false); // Status cek API
  
  const [fotoBarang, setFotoBarang] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [wbpResults, setWbpResults] = useState([]);
  const [selectedWbp, setSelectedWbp] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const suggestionRef = useRef(null);

  const minDate = new Date().toLocaleDateString('en-CA');

  // Logic Membersihkan data WBP
  const cleanWbpData = useMemo(() => {
    const sourceData = Array.isArray(wbpRawData) ? wbpRawData : (wbpRawData.data || []);
    return sourceData.filter(item => 
      item && item.nama && item.nama !== "Nama" && item.nama.trim() !== ""
    );
  }, []);

  // LOGIC: Cek Libur Nasional via API (Termasuk Nyepi, Galungan, dll)
  const checkLiburNasional = async (tanggalTerpilih) => {
    try {
      setCheckingLibur(true);
      const tahun = new Date(tanggalTerpilih).getFullYear();
      const response = await fetch(`https://api-harilibur.vercel.app/api?year=${tahun}`);
      const daftarLibur = await response.json();

      const hariLibur = daftarLibur.find(libur => libur.holiday_date === tanggalTerpilih);

      if (hariLibur) {
        return { isLibur: true, keterangan: hariLibur.holiday_name };
      }
      return { isLibur: false };
    } catch (error) {
      console.error("Gagal cek API libur:", error);
      return { isLibur: false }; 
    } finally {
      setCheckingLibur(false);
    }
  };

  // Logic Pencarian WBP
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (term.length < 2 || selectedWbp) {
      setWbpResults([]);
      setIsMenuOpen(false);
      return;
    }
    const results = cleanWbpData.filter(wbp => 
      (wbp.nama && wbp.nama.toLowerCase().includes(term)) || 
      (wbp.no_registrasi && wbp.no_registrasi.toLowerCase().includes(term))
    );
    setWbpResults(results.slice(0, 10));
    setIsMenuOpen(true);
  }, [searchTerm, cleanWbpData, selectedWbp]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) return alert("Ukuran foto terlalu besar! Maksimal 2MB");
      setFotoBarang(file);
      if (previewUrl) URL.revokeObjectURL(previewUrl); 
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  // HANDLER TANGGAL DENGAN SMART VALIDATION
  const handleTanggalChange = async (e) => {
    const tgl = e.target.value;
    if (!tgl) return;

    // 1. Cek Akhir Pekan (Layanan Penitipan biasanya tutup Sabtu-Minggu)
    const day = new Date(tgl).getDay();
    if (day === 0 || day === 6) {
      alert("⚠️ Maaf, pendaftaran penitipan tutup pada hari Sabtu & Minggu.");
      setForm({ ...form, tanggal: "" });
      return;
    }

    // 2. Cek Libur Nasional
    const resLibur = await checkLiburNasional(tgl);
    if (resLibur.isLibur) {
      alert(`🚫 LAYANAN LIBUR\nKeterangan: ${resLibur.keterangan}\n\nSilakan pilih hari kerja lainnya.`);
      setForm({ ...form, tanggal: "" });
      return;
    }

    setForm({ ...form, tanggal: tgl });
  };

  const handleSimpan = async (e) => {
    e.preventDefault();
    if (!selectedWbp) return alert("Silakan pilih Warga Binaan tujuan!");
    if (!fotoBarang) return alert("Mohon lampirkan foto barang titipan!");
    if (!form.tanggal) return alert("Pilih tanggal penitipan!");
    
    setLoading(true);

    try {
      const fileExt = fotoBarang.name.split('.').pop();
      const fileName = `${Date.now()}_${user.id}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('barang-titipan')
        .upload(fileName, fotoBarang);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('barang-titipan')
        .getPublicUrl(fileName);

      const { data: lastAntrean } = await supabase
        .from('kunjungan')
        .select('antrean')
        .eq('tanggal', form.tanggal)
        .eq('tipe', 'penitipan')
        .order('created_at', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (lastAntrean && lastAntrean.length > 0 && lastAntrean[0].antrean) {
        const parts = lastAntrean[0].antrean.split('-');
        const lastNum = parseInt(parts[1]);
        if (!isNaN(lastNum)) nextNumber = lastNum + 1;
      }
      const antreanPrefix = `P-${nextNumber.toString().padStart(2, '0')}`;

      const payload = {
        user_id: user.id,
        nama_pengunjung: user.nama,
        wbp: selectedWbp.nama,
        tanggal: form.tanggal,
        tipe: 'penitipan',
        antrean: antreanPrefix,
        keterangan: `${form.jenis} (${form.jumlah} pcs/box) - ${form.ket || '-'}`,
        foto_barang: publicUrl,
        status: 'pending',
        kamar_wbp: selectedWbp.blok_kamar || '-'
      };

      const { data: insertedData, error } = await supabase
        .from('kunjungan')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      localStorage.setItem("tiket_aktif", JSON.stringify(insertedData));
      alert(`✅ Penitipan Berhasil!\nNomor Antrean: ${antreanPrefix}`);
      navigate("/tiket-penitipan");

    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan: " + (err.message || "Gagal menyimpan data"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '500px', margin: 'auto', minHeight: '100vh', background: '#f0fdf4' }}>
      <div style={{ background: '#059669', padding: '30px 20px', color: 'white', textAlign: 'center', borderRadius: '0 0 25px 25px' }}>
        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800' }}>📦 PENITIPAN BARANG</h1>
        <p style={{ margin: '5px 0 0', opacity: 0.8, fontSize: '12px' }}>Lapas Kelas IIA Kerobokan</p>
      </div>

      <div style={{ padding: '20px' }}>
        <div style={{ background: 'white', padding: '25px', borderRadius: '20px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}>
          <form onSubmit={handleSimpan}>
            
            <div style={{ position: 'relative', marginBottom: '15px' }} ref={suggestionRef}>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#065f46', marginBottom: '8px' }}>
                Cari Warga Binaan (WBP)
              </label>
              <input 
                type="text" required placeholder="Ketik nama atau no registrasi..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setSelectedWbp(null); }}
                autoComplete="off"
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1fae5', boxSizing: 'border-box' }}
              />
              
              {isMenuOpen && wbpResults.length > 0 && (
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', border: '1px solid #d1fae5', borderRadius: '10px', zIndex: 100, boxShadow: '0 10px 15px rgba(0,0,0,0.1)', marginTop: '5px', overflow: 'hidden' }}>
                  {wbpResults.map((w, idx) => (
                    <div key={idx} onClick={() => { setSelectedWbp(w); setSearchTerm(w.nama); setIsMenuOpen(false); }}
                      style={{ padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f0fdf4' }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{w.nama}</div>
                      <div style={{ fontSize: '11px', color: '#059669' }}>{w.blok_kamar} | {w.no_registrasi}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedWbp && (
              <div style={{ background: '#ecfdf5', color: '#065f46', padding: '12px', borderRadius: '10px', border: '1px solid #a7f3d0', marginBottom: '20px', fontSize: '13px' }}>
                ✅ <b>Tujuan:</b> {selectedWbp.nama} <br/><small>{selectedWbp.blok_kamar}</small>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#065f46', marginBottom: '5px' }}>Jenis</label>
                <select required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1fae5' }} onChange={e => setForm({...form, jenis: e.target.value})}>
                  <option value="">-- Pilih --</option>
                  <option>Makanan</option>
                  <option>Pakaian</option>
                  <option>Alat Mandi</option>
                  <option>Lainnya</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#065f46', marginBottom: '5px' }}>Jumlah</label>
                <input type="number" required placeholder="Pcs/Box" style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1fae5', boxSizing: 'border-box' }} onChange={e => setForm({...form, jumlah: e.target.value})} />
              </div>
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#065f46', marginBottom: '8px' }}>
              Tanggal Penitipan {checkingLibur && <span style={{ fontSize: '10px', color: '#059669' }}>(Cek Hari Libur...)</span>}
            </label>
            <input 
              type="date" 
              required 
              min={minDate}
              value={form.tanggal}
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1fae5', marginBottom: '15px', boxSizing: 'border-box' }}
              onChange={handleTanggalChange} 
            />

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#065f46', marginBottom: '8px' }}>Foto Barang Titipan</label>
            <div style={{ marginBottom: '15px' }}>
              <input 
                type="file" accept="image/*" capture="environment" 
                onChange={handleFileChange}
                style={{ fontSize: '12px', marginBottom: '10px' }}
              />
              {previewUrl && (
                <img src={previewUrl} alt="Preview" style={{ width: '100%', borderRadius: '10px', border: '2px dashed #059669' }} />
              )}
            </div>

            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', color: '#065f46', marginBottom: '8px' }}>Keterangan Barang</label>
            <textarea 
              placeholder="Contoh: Nasi bungkus, roti, kaos polos..." 
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #d1fae5', height: '80px', marginBottom: '25px', boxSizing: 'border-box' }}
              onChange={e => setForm({...form, ket: e.target.value})}
            ></textarea>

            <button 
              type="submit" disabled={loading || checkingLibur || !selectedWbp} 
              style={{ 
                width: '100%', padding: '16px', borderRadius: '15px', border: 'none', 
                background: loading || checkingLibur || !selectedWbp ? '#9ca3af' : '#059669', 
                color: 'white', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer',
                transition: '0.3s', opacity: (loading || checkingLibur) ? 0.8 : 1
              }}
            >
              {loading ? "MEMPROSES..." : checkingLibur ? "MENGECEK TANGGAL..." : "➜ SIMPAN & AMBIL TIKET"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}