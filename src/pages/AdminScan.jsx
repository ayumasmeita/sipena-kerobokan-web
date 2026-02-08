import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';

export default function AdminScan() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [showManualForm, setShowManualForm] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const navigate = useNavigate();

  // Handler untuk capture foto
  const handleFileCapture = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Preview image
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target.result);
      setImageFile(file);
    };
    reader.readAsDataURL(file);
  };

  // Handler untuk proses QR code dari foto
  const handleProcessQR = async () => {
    if (!imageFile) {
      alert("❌ Belum ada foto yang diambil!");
      return;
    }

    setIsProcessing(true);

    try {
      // Import jsQR library
      const { default: jsQR } = await import('jsqr');
      
      // Convert image to canvas
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            console.log("✅ QR CODE TERDETEKSI!");
            console.log("📱 URL:", code.data);
            processQRCode(code.data);
          } else {
            alert("❌ QR Code tidak terdeteksi!\n\nPastikan:\n- QR code terlihat jelas\n- Tidak blur/kabur\n- Pencahayaan cukup\n\nCoba foto ulang atau gunakan Input ID Manual.");
            setIsProcessing(false);
          }
        };
        img.src = event.target.result;
      };

      reader.readAsDataURL(imageFile);

    } catch (err) {
      console.error("Error:", err);
      alert("Gagal memproses gambar: " + err.message);
      setIsProcessing(false);
    }
  };

  // Handler untuk foto ulang
  const handleRetake = () => {
    setCapturedImage(null);
    setImageFile(null);
    // Reset input file
    const fileInput = document.getElementById('qr-camera-input');
    if (fileInput) fileInput.value = '';
  };

  // Handler untuk manual input ID
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualInput.trim()) {
      alert("Masukkan ID Ticket!");
      return;
    }
    
    setIsProcessing(true);
    // Generate full URL dari ID
    const fullUrl = `${window.location.origin}/verify/${manualInput.trim()}`;
    processQRCode(fullUrl);
  };

  // Process QR Code data
  const processQRCode = async (decodedText) => {
    try {
      let idTicket = "";
      let targetPath = "";

      const url = decodedText.trim();
      
      if (url.includes('/verify-item/')) {
        const parts = url.split('/verify-item/');
        idTicket = parts[1]?.split('?')[0]?.split('#')[0];
        targetPath = `/verify-item/${idTicket}`;
      } else if (url.includes('/verify/')) {
        const parts = url.split('/verify/');
        idTicket = parts[1]?.split('?')[0]?.split('#')[0];
        targetPath = `/verify/${idTicket}`;
      } else if (url.includes('/verify-visit/')) {
        const parts = url.split('/verify-visit/');
        idTicket = parts[1]?.split('?')[0]?.split('#')[0];
        targetPath = `/verify-visit/${idTicket}`;
      } else {
        const urlParts = url.split('/');
        idTicket = urlParts[urlParts.length - 1]?.split('?')[0]?.split('#')[0];
        targetPath = `/verify/${idTicket}`;
      }

      console.log("🎫 ID Ticket:", idTicket);
      console.log("🚀 Target Path:", targetPath);

      if (!idTicket || idTicket.length < 5) {
        throw new Error("ID ticket tidak valid: " + idTicket);
      }

      // Update database
      const { error: dbError } = await supabase
        .from('kunjungan')
        .update({ status: 'selesai' })
        .eq('id', idTicket);

      if (dbError) {
        console.error("❌ Supabase error:", dbError);
        throw dbError;
      }

      console.log("✅ Database berhasil diupdate");

      setStatusMsg("TIKET BERHASIL TERVERIFIKASI!");
      setShowSuccessAnim(true);

      setTimeout(() => {
        navigate(targetPath);
      }, 2000);

    } catch (err) {
      console.error("❌ Error processing:", err);
      alert(`Gagal memproses QR Code:\n\n${err.message}\n\nURL: ${decodedText}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="app" style={{ background: '#f8fafc', minHeight: '100vh' }}>
      <div className="app-header" style={{ 
        background: '#1e293b', 
        padding: '20px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: 0, 
          fontSize: '18px', 
          color: 'white', 
          textAlign: 'center' 
        }}>📷 Scanner Petugas</h1>
      </div>

      <div style={{ padding: '20px' }}>
        {!showSuccessAnim ? (
          <>
            <div className="status-card" style={{ 
              background: 'white', 
              padding: '25px', 
              borderRadius: '20px', 
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              marginBottom: '15px'
            }}>
              <p style={{ 
                textAlign: 'center', 
                marginBottom: '20px', 
                fontWeight: 'bold', 
                color: isProcessing ? '#3b82f6' : '#64748b',
                fontSize: '15px'
              }}>
                {isProcessing ? "⏳ Memproses Data..." : capturedImage ? "📸 Foto Berhasil Diambil" : "📷 Scan QR Code Tiket"}
              </p>

              {/* PREVIEW IMAGE */}
              {capturedImage ? (
                <div style={{ marginBottom: '20px' }}>
                  <div style={{
                    border: '3px solid #3b82f6',
                    borderRadius: '15px',
                    overflow: 'hidden',
                    marginBottom: '15px'
                  }}>
                    <img 
                      src={capturedImage} 
                      alt="QR Code Preview" 
                      style={{ 
                        width: '100%', 
                        height: 'auto',
                        display: 'block'
                      }} 
                    />
                  </div>

                  {/* BUTTON PROSES & FOTO ULANG */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      onClick={handleProcessQR}
                      disabled={isProcessing}
                      style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.6 : 1,
                        boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                      }}
                    >
                      ✓ PROSES QR CODE
                    </button>
                    <button
                      onClick={handleRetake}
                      disabled={isProcessing}
                      style={{
                        padding: '15px',
                        background: 'white',
                        color: '#64748b',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        opacity: isProcessing ? 0.6 : 1
                      }}
                    >
                      🔄 FOTO ULANG
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* BUTTON BUKA KAMERA NATIVE */}
                  <label 
                    htmlFor="qr-camera-input"
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '20px',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                      color: 'white',
                      borderRadius: '15px',
                      textAlign: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px',
                      cursor: isProcessing ? 'not-allowed' : 'pointer',
                      marginBottom: '15px',
                      boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                      opacity: isProcessing ? 0.6 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    📸 AMBIL FOTO QR CODE
                  </label>
                  <input 
                    id="qr-camera-input"
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    onChange={handleFileCapture}
                    disabled={isProcessing}
                    style={{ display: 'none' }}
                  />

                  {/* DIVIDER */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    margin: '20px 0',
                    gap: '10px'
                  }}>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold' }}>ATAU</span>
                    <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  </div>

                  {/* BUTTON MANUAL INPUT */}
                  <button
                    onClick={() => setShowManualForm(!showManualForm)}
                    style={{
                      width: '100%',
                      padding: '15px',
                      background: 'white',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      color: '#64748b',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      fontSize: '14px',
                      marginBottom: showManualForm ? '15px' : '0'
                    }}
                  >
                    ⌨️ Input ID Manual {showManualForm ? '▲' : '▼'}
                  </button>

                  {/* MANUAL INPUT FORM */}
                  {showManualForm && (
                    <form onSubmit={handleManualSubmit} style={{
                      background: '#f8fafc',
                      padding: '15px',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      animation: 'slideDown 0.3s ease-out'
                    }}>
                      <label style={{
                        display: 'block',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#475569',
                        marginBottom: '8px'
                      }}>
                        Masukkan ID Ticket:
                      </label>
                      <input
                        type="text"
                        value={manualInput}
                        onChange={(e) => setManualInput(e.target.value)}
                        placeholder="Contoh: abc123-def456-ghi789"
                        required
                        style={{
                          width: '100%',
                          padding: '12px',
                          borderRadius: '10px',
                          border: '2px solid #cbd5e1',
                          fontSize: '13px',
                          marginBottom: '10px'
                        }}
                      />
                      <button
                        type="submit"
                        disabled={isProcessing}
                        style={{
                          width: '100%',
                          padding: '12px',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 'bold',
                          cursor: isProcessing ? 'not-allowed' : 'pointer',
                          opacity: isProcessing ? 0.6 : 1
                        }}
                      >
                        ✓ Verifikasi Sekarang
                      </button>
                    </form>
                  )}
                </>
              )}

              {/* Tips Section */}
              <div style={{ 
                marginTop: '20px', 
                padding: '15px',
                background: '#f0f9ff',
                borderRadius: '12px',
                border: '1px solid #bae6fd'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  color: '#0369a1', 
                  fontWeight: 'bold',
                  marginBottom: '8px'
                }}>
                  💡 PANDUAN SCAN:
                </div>
                <ol style={{ 
                  margin: 0, 
                  paddingLeft: '20px',
                  fontSize: '12px',
                  color: '#0c4a6e',
                  lineHeight: '1.8'
                }}>
                  <li>Klik tombol <strong>"AMBIL FOTO QR CODE"</strong></li>
                  <li>Arahkan kamera ke QR code dengan <strong>jarak 15-30cm</strong></li>
                  <li>Pastikan QR code <strong>tidak blur dan terlihat jelas</strong></li>
                  <li>Ambil foto dengan pencahayaan yang <strong>cukup terang</strong></li>
                  <li>Setelah foto muncul, klik <strong>"PROSES QR CODE"</strong></li>
                  <li>Sistem akan otomatis verifikasi dan redirect</li>
                </ol>
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  fontSize: '11px',
                  color: '#92400e'
                }}>
                  <strong>⚠️ Jika QR rusak/tidak terbaca:</strong> Gunakan opsi "Input ID Manual" dan masukkan ID yang tertera di tiket.
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="success-animation-overlay">
            <div className="swal2-icon swal2-success swal2-animate-success-icon">
              <div className="swal2-success-circular-line-left"></div>
              <span className="swal2-success-line-tip"></span>
              <span className="swal2-success-line-long"></span>
              <div className="swal2-success-ring"></div>
              <div className="swal2-success-fix"></div>
              <div className="swal2-success-circular-line-right"></div>
            </div>
            <h2 style={{ color: '#059669', marginTop: '20px', fontSize: '20px' }}>{statusMsg}</h2>
            <p style={{ color: '#64748b', fontSize: '14px' }}>Membuka detail tiket...</p>
          </div>
        )}
       
        <button 
          style={{ 
            width: '100%', 
            marginTop: '10px', 
            padding: '15px', 
            background: 'white', 
            border: '2px solid #e2e8f0', 
            borderRadius: '12px', 
            color: '#64748b', 
            fontWeight: 'bold', 
            cursor: isProcessing ? 'not-allowed' : 'pointer', 
            fontSize: '14px', 
            opacity: isProcessing ? 0.6 : 1 
          }} 
          onClick={() => navigate(-1)}
          disabled={isProcessing}
        >
          ⬅ Kembali ke Dashboard
        </button>
      </div>

      <style>{`
        .success-animation-overlay { 
          text-align: center; 
          padding: 50px 20px; 
          background: white; 
          border-radius: 20px; 
          box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
          animation: slideUp 0.5s ease-out; 
        }
        
        @keyframes slideUp { 
          from { transform: translateY(20px); opacity: 0; } 
          to { transform: translateY(0); opacity: 1; } 
        }

        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
       
        .swal2-icon.swal2-success { border-color: #a5dc86; }
        .swal2-icon { 
          position: relative; 
          width: 5em; 
          height: 5em; 
          margin: 1.25em auto 1.875em; 
          border: .25em solid transparent; 
          border-radius: 50%; 
        }
        .swal2-success-ring { 
          position: absolute; 
          z-index: 2; 
          top: -.25em; 
          left: -.25em; 
          width: 100%; 
          height: 100%; 
          border: .25em solid rgba(165, 220, 134, .3); 
          border-radius: 50%; 
        }
        .swal2-success-line-tip { 
          top: 2.875em; 
          left: .875em; 
          width: 1.5625em; 
          transform: rotate(45deg); 
        }
        .swal2-success-line-long { 
          top: 2.375em; 
          right: .5em; 
          width: 2.9375em; 
          transform: rotate(-45deg); 
        }
        .swal2-success-line-tip, .swal2-success-line-long { 
          display: block; 
          position: absolute; 
          z-index: 2; 
          height: .3125em; 
          border-radius: .125em; 
          background-color: #a5dc86; 
        }
        .swal2-animate-success-line-tip { 
          animation: swal2-animate-success-line-tip .75s; 
        }
        .swal2-animate-success-line-long { 
          animation: swal2-animate-success-line-long .75s; 
        }
        
        @keyframes swal2-animate-success-line-tip { 
          0% { width: 0; left: .0625em; top: 1.1875em; } 
          54% { width: 0; left: .125em; top: 1.125em; } 
          100% { width: 1.5625em; left: .875em; top: 2.875em; } 
        }
        
        @keyframes swal2-animate-success-line-long { 
          0% { width: 0; right: 2.875em; top: 3.375em; } 
          65% { width: 0; right: 2.875em; top: 3.375em; } 
          100% { width: 2.9375em; right: .5em; top: 2.375em; } 
        }

        label[for="qr-camera-input"]:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5);
        }

        label[for="qr-camera-input"]:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}