import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';

// Import logo dari folder src
import logoKemenimipas from '../logo-kemenimipas.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (error || !data) {
        alert("❌ Username atau password salah!");
      } else {
        // Cek jika akun belum disetujui (Kecuali Admin)
        if (data.username !== 'admin' && !data.is_approved) {
          alert("⏳ Akun Anda sedang menunggu verifikasi Admin.");
          return;
        }

        alert("✅ Login berhasil!");
        localStorage.setItem("user", JSON.stringify(data));
        
        // JIKA ADMIN -> Ke Panel Admin, JIKA USER -> Ke Dashboard
        if (data.username === 'admin') {
          navigate("/admin-sipena-secret");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (err) {
      alert("Terjadi kesalahan koneksi!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <div className="app-header">
        {/* Mengganti emoji perisai dengan logo image */}
        <div className="logo">
          <img 
            src={logoKemenimipas} 
            alt="Logo Kemenimipas" 
            style={{ width: '80px', height: 'auto' }} 
          />
        </div>
        <div>
          <h1>Login SIPENA</h1>
          <p>Lapas Kelas IIA Kerobokan</p>
        </div>
      </div>

      <div className="form-card">
        <h2>Masuk</h2>
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '15px' }}>
            <label>Username</label>
            <input 
              type="text" 
              placeholder="Masukkan username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Masukkan password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-full" disabled={loading}>
            {loading ? 'Mengecek...' : 'Masuk'}
          </button>
        </form>
        <div style={{ textAlign: 'center', marginTop: '15px', fontSize: '14px' }}>
          Belum punya akun? <Link to="/register" style={{ color: '#2563eb', fontWeight: 'bold' }}>Daftar Disini</Link>
        </div>
      </div>
    </div>
  );
}