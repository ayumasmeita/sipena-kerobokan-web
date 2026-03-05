import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    <div className="app-container">
      {/* HEADER */}
      <div className="app-header">
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 'clamp(18px, 3.5vw, 24px)' }}>Registrasi Layanan</h1>
          <p style={{ margin: '4px 0 0', fontSize: 'clamp(12px, 2vw, 13px)' }}>Lengkapi data untuk pendaftaran online</p>
        </div>
      </div>

      <div style={{ 
        padding: 'clamp(16px, 3vw, 24px)',
        maxWidth: '800px',
        margin: '0 auto'
      }}>
        <form onSubmit={handleRegister} className="form-card">
          
          {/* SECTION 1: DATA DIRI */}
          <div style={{ 
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '2px solid #f1f5f9'
          }}>
            <h3 style={{ 
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              color: '#3b82f6',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 800,
              marginBottom: '20px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              📋 Data Diri Pengunjung
            </h3>
            
            <div style={{ marginBottom: '18px' }}>
              <label>Nama Lengkap (Sesuai ID)</label>
              <input 
                required 
                placeholder="Masukkan nama sesuai identitas" 
                onChange={e => setForm({...form, nama: e.target.value})} 
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label>Jenis Identitas</label>
              <select 
                value={form.jenis_identitas}
                onChange={(e) => setForm({...form, jenis_identitas: e.target.value})}
              >
                <option value="KTP">KTP (Warga Negara Indonesia)</option>
                <option value="PASSPORT">Passport (Warga Negara Asing)</option>
                <option value="KARTU PELAJAR">Kartu Pelajar / Mahasiswa</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label>Nomor {form.jenis_identitas}</label>
              <input 
                required 
                placeholder={`Masukkan nomor ${form.jenis_identitas}`} 
                onChange={e => setForm({...form, nik: e.target.value})} 
              />
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label>Alamat Lengkap</label>
              <textarea 
                required 
                placeholder="Alamat rumah saat ini" 
                onChange={e => setForm({...form, alamat: e.target.value})} 
              />
            </div>

            <div>
              <label>Foto {form.jenis_identitas}</label>
              <input 
                required 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                style={{ 
                  padding: '10px',
                  fontSize: 'clamp(12px, 2vw, 14px)',
                  cursor: 'pointer'
                }}
              />
              
              {previewUrl && (
                <div style={{ 
                  marginTop: '14px',
                  padding: '8px',
                  border: '2px solid #3b82f6',
                  borderRadius: '16px',
                  background: '#eff6ff'
                }}>
                  <img 
                    src={previewUrl} 
                    alt="Preview" 
                    style={{ 
                      width: '100%',
                      borderRadius: '12px',
                      display: 'block'
                    }} 
                  />
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: HUBUNGAN DENGAN WBP */}
          <div style={{ 
            marginBottom: '32px',
            paddingBottom: '24px',
            borderBottom: '2px solid #f1f5f9'
          }}>
            <h3 style={{ 
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              color: '#3b82f6',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 800,
              marginBottom: '20px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              👤 Hubungan dengan WBP
            </h3>

            <div style={{ position: 'relative', marginBottom: '18px' }}>
              <label>Cari Nama WBP</label>
              <input 
                placeholder="Ketik nama warga binaan..." 
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setSelectedWbp(null); }} 
              />
              {isMenuOpen && wbpResults.length > 0 && (
                <div className="search-results" style={{ 
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  zIndex: 10,
                  marginTop: '8px'
                }}>
                  {wbpResults.map((w, index) => (
                    <div 
                      key={index} 
                      className="result-item"
                      onClick={() => { 
                        setSelectedWbp(w); 
                        setSearchTerm(w.nama); 
                        setIsMenuOpen(false); 
                      }}
                    >
                      <div style={{ fontWeight: 'bold', fontSize: 'clamp(13px, 2.5vw, 14px)' }}>
                        {w.nama}
                      </div>
                      <div style={{ fontSize: 'clamp(11px, 2vw, 12px)', color: '#3b82f6', marginTop: '2px' }}>
                        {w.blok_kamar}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedWbp && (
              <div className="selected-badge">
                ✅ Terpilih: <b>{selectedWbp.nama}</b> ({selectedWbp.blok_kamar})
              </div>
            )}

            <div style={{ marginTop: '18px' }}>
              <label>Hubungan dengan WBP</label>
              <select 
                required 
                onChange={e => setForm({...form, hubungan: e.target.value})}
              >
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
            </div>
          </div>

          {/* SECTION 3: AKSES LOGIN */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ 
              fontSize: 'clamp(14px, 2.5vw, 16px)',
              color: '#3b82f6',
              fontFamily: '"Outfit", sans-serif',
              fontWeight: 800,
              marginBottom: '20px',
              letterSpacing: '0.5px',
              textTransform: 'uppercase'
            }}>
              🔐 Akses Login
            </h3>
            
            <div style={{ marginBottom: '18px' }}>
              <label>Username</label>
              <input 
                required 
                placeholder="Buat username untuk login" 
                onChange={e => setForm({...form, username: e.target.value})} 
              />
            </div>

            <div>
              <label>Password</label>
              <input 
                type="password" 
                required 
                placeholder="Buat password yang kuat" 
                onChange={e => setForm({...form, password: e.target.value})} 
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading || !selectedWbp} 
            className="btn-full"
            style={{ margin: '24px 0 0 0', width: '100%' }}
          >
            {loading ? "⏳ Menyimpan Data..." : "✓ Daftar Sekarang"}
          </button>
        </form>

        {/* Back to Login */}
        <Link 
          to="/login" 
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
          ← Sudah punya akun? Login disini
        </Link>
      </div>
    </div>
  );
}