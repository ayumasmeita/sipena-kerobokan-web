import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
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
        if (data.username !== 'admin' && !data.is_approved) {
          alert("⏳ Akun Anda sedang menunggu verifikasi Admin.");
          return;
        }

        alert("✅ Login berhasil!");
        localStorage.setItem("user", JSON.stringify(data));
        
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
        <div className="logo">
          <img 
            src={logoKemenimipas} 
            alt="Logo Kemenimipas" 
            style={{ width: 'clamp(60px, 12vw, 90px)', height: 'auto' }} 
          />
        </div>
        <div>
          <h1>Login SIPENA</h1>
          <p>Lapas Kelas IIA Kerobokan</p>
        </div>
      </div>

      <div className="form-card">
        <h2>Masuk ke Akun</h2>
        <form onSubmit={handleLogin}>
          <div>
            <label>Username</label>
            <input 
              type="text" 
              placeholder="Masukkan username Anda" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div>
            <label>Password</label>
            <input 
              type="password" 
              placeholder="Masukkan password Anda" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <button type="submit" className="btn-full" disabled={loading}>
            {loading ? '⏳ Mengecek...' : '➜ Masuk'}
          </button>
        </form>
        <div style={{ 
          textAlign: 'center', 
          marginTop: '20px', 
          fontSize: 'clamp(13px, 2.5vw, 14px)',
          color: '#64748b'
        }}>
          Belum punya akun? <Link 
            to="/register" 
            style={{ 
              color: '#3b82f6', 
              fontWeight: '700',
              textDecoration: 'none',
              transition: 'color 0.3s ease'
            }}
            onMouseOver={(e) => e.target.style.color = '#1e40af'}
            onMouseOut={(e) => e.target.style.color = '#3b82f6'}
          >
            Daftar Disini
          </Link>
        </div>
      </div>

      {/* Back to Home */}
      <Link 
        to="/" 
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
        ← Kembali ke Beranda
      </Link>
    </div>
  );
}