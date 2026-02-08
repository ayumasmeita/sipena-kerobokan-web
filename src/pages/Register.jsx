import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import wbpRawData from '../wbp.json'; 

export default function Register() {
  const [form, setForm] = useState({ 
    nama: '', nik: '', alamat: '', 
    username: '', password: '', hubungan: '',
    jenis_identitas: 'KTP'
  });
  
  const [fotoKtp, setFotoKtp] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [wbpResults, setWbpResults] = useState([]);
  const [selectedWbp, setSelectedWbp] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const cleanWbpData = useMemo(() => {
    const sourceData = Array.isArray(wbpRawData) ? wbpRawData : (wbpRawData.data || []);
    return sourceData.filter(item => 
      item && item.nama && item.nama !== "Nama" && item.nama.trim() !== ""
    );
  }, []);

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
    setWbpResults(results.slice(0, 20));
    setIsMenuOpen(true);
  }, [searchTerm, cleanWbpData, selectedWbp]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFotoKtp(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const parseBlokKamar = (str) => {
    if (!str || typeof str !== 'string') return { blok: "UMUM", kamar: "-" };
    try {
      const cleanStr = str.replace("WISMA ", "");
      const parts = cleanStr.split(" - "); 
      const namaWisma = parts[0] || "UMUM"; 
      const nomorKamar = parts[1] || "-"; 
      const blokKode = nomorKamar.charAt(0); 
      
      return {
        blok: `${namaWisma} ${blokKode}`.toUpperCase(), 
        kamar: nomorKamar
      };
    } catch (e) {
      return { blok: "UMUM", kamar: "-" };
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!selectedWbp) return alert("Silakan pilih Warga Binaan!");
    
    if (form.jenis_identitas === 'KTP' && form.nik.length !== 16) {
        return alert("NIK harus 16 digit!");
    }
    
    if (!fotoKtp) return alert(`Silakan upload foto ${form.jenis_identitas} Anda!`);

    setLoading(true);
    const infoLokasi = parseBlokKamar(selectedWbp.blok_kamar);

    try {
      const fileExt = fotoKtp.name.split('.').pop();
      const fileName = `${Date.now()}_${form.nik}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('identitas')
        .upload(fileName, fotoKtp);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('identitas')
        .getPublicUrl(fileName);

      const { error } = await supabase.from('users').insert([{ 
        ...form,
        wbp: selectedWbp.nama,
        kamar_wbp: infoLokasi.kamar,
        blok_wbp: infoLokasi.blok,
        foto_ktp_url: publicUrl,
        is_approved: false 
      }]);

      if (error) throw error;
      
      alert("✅ Registrasi Berhasil!\nAkun Anda akan diverifikasi Admin dalam 1x24 jam.");
      navigate("/login");
    } catch (err) {
      alert("Gagal Daftar: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ maxWidth: '500px', margin: 'auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '30px' }}>
      <div style={{ background: '#0f172a', padding: '30px 20px', color: 'white', borderRadius: '0 0 20px 20px', textAlign: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '22px' }}>Registrasi Layanan</h1>
        <p style={{ margin: '5px 0 0', fontSize: '13px', color: '#94a3b8' }}>Lengkapi data untuk pendaftaran online</p>
      </div>

      <div style={{ padding: '20px' }}>
        <form onSubmit={handleRegister} style={{ background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          
          <h3 style={{ fontSize: '14px', color: '#3b82f6', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>DATA DIRI PENGUNJUNG</h3>
          
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Nama Lengkap (Sesuai ID)</label>
          <input required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', boxSizing: 'border-box' }} placeholder="Masukkan nama sesuai identitas" onChange={e => setForm({...form, nama: e.target.value})} />

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Jenis Identitas</label>
          <select 
            value={form.jenis_identitas}
            onChange={(e) => setForm({...form, jenis_identitas: e.target.value})}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px' }}
          >
            <option value="KTP">KTP (Warga Negara Indonesia)</option>
            <option value="PASSPORT">Passport (Warga Negara Asing)</option>
            <option value="KARTU PELAJAR">Kartu Pelajar / Mahasiswa</option>
            <option value="LAINNYA">Lainnya</option>
          </select>

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Nomor {form.jenis_identitas}</label>
          <input required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', boxSizing: 'border-box' }} placeholder={`Masukkan nomor ${form.jenis_identitas}`} onChange={e => setForm({...form, nik: e.target.value})} />

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Alamat Lengkap</label>
          <textarea required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '15px', minHeight: '80px', boxSizing: 'border-box' }} placeholder="Alamat rumah saat ini" onChange={e => setForm({...form, alamat: e.target.value})} />

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Foto {form.jenis_identitas}</label>
          <input required type="file" accept="image/*" onChange={handleFileChange} style={{ marginBottom: '10px', fontSize: '12px' }} />
          
          {previewUrl && (
            <div style={{ marginBottom: '15px', padding: '5px', border: '1px solid #3b82f6', borderRadius: '10px' }}>
              <img src={previewUrl} alt="Preview" style={{ width: '100%', borderRadius: '8px' }} />
            </div>
          )}

          <h3 style={{ fontSize: '14px', color: '#3b82f6', marginTop: '25px', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>HUBUNGAN DENGAN WBP</h3>

          <div style={{ position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Cari Nama WBP</label>
            <input 
              style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px', boxSizing: 'border-box' }}
              placeholder="Ketik nama warga binaan..." 
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSelectedWbp(null); }} 
            />
            {isMenuOpen && wbpResults.length > 0 && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', zIndex: 10, borderRadius: '10px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0', maxHeight: '200px', overflowY: 'auto' }}>
                {wbpResults.map((w, index) => (
                  <div key={index} style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => { setSelectedWbp(w); setSearchTerm(w.nama); setIsMenuOpen(false); }}>
                    <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{w.nama}</div>
                    <div style={{ fontSize: '11px', color: '#3b82f6' }}>{w.blok_kamar}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedWbp && (
            <div style={{ background: '#f0fdf4', color: '#166534', padding: '10px', borderRadius: '10px', fontSize: '12px', marginBottom: '15px', border: '1px solid #bbf7d0' }}>
              ✅ Terpilih: <b>{selectedWbp.nama}</b> ({selectedWbp.blok_kamar})
            </div>
          )}

          <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: '#475569', marginBottom: '5px' }}>Hubungan</label>
          <select required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px' }} onChange={e => setForm({...form, hubungan: e.target.value})}>
            <option value="">-- Pilih Hubungan --</option>
            <option>Ayah</option>
            <option>Ibu</option>
            <option>Istri/Suami</option>
            <option>Anak</option>
            <option>Adik</option>
            <option>Kakak</option>
            <option>Saudara Jauh</option>
            <option>Teman</option>
            <option>Sepupu</option>
            <option>Lainnya</option>
          </select>

          <h3 style={{ fontSize: '14px', color: '#3b82f6', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>AKSES LOGIN</h3>
          
          <input required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '10px', boxSizing: 'border-box' }} placeholder="Buat Username" onChange={e => setForm({...form, username: e.target.value})} />
          <input type="password" required style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '20px', boxSizing: 'border-box' }} placeholder="Buat Password" onChange={e => setForm({...form, password: e.target.value})} />

          <button type="submit" disabled={loading || !selectedWbp} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#3b82f6', color: 'white', fontWeight: 'bold', cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? "Menyimpan Data..." : "Daftar Sekarang"}
          </button>
        </form>
      </div>
    </div>
  );
}