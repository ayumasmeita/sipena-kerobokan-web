import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Kunjungan from './pages/Kunjungan';
import Penitipan from './pages/Penitipan';
import TiketKunjungan from './pages/TiketKunjungan';
import Admin from './pages/Admin';
import History from './pages/History'; 
import AdminScan from './pages/AdminScan';
import TiketPenitipanUser from './pages/TiketPenitipanUser';
import TiketPublicPenitipan from './pages/TiketPublicPenitipan';
import TiketPublic from './pages/TiketPublic'; 

const PrivateRoute = ({ children }) => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminRoute = ({ children }) => {
  const userString = localStorage.getItem("user");
  const user = userString ? JSON.parse(userString) : null;
  const isAdmin = user && (user.username === 'admin' || user.role === 'admin');
  return isAdmin ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* FIX: Daftarkan rute agar sinkron dengan link QR Code */}
          <Route path="/verify/:id" element={<TiketPublic />} />
          <Route path="/verify-visit/:id" element={<TiketPublic />} />
          <Route path="/verify-item/:id" element={<TiketPublicPenitipan />} />
          
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/kunjungan" element={<PrivateRoute><Kunjungan /></PrivateRoute>} />
          <Route path="/penitipan" element={<PrivateRoute><Penitipan /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/tiket-kunjungan" element={<PrivateRoute><TiketKunjungan /></PrivateRoute>} />
          <Route path="/tiket-penitipan" element={<PrivateRoute><TiketPenitipanUser /></PrivateRoute>} />
          
          <Route path="/admin-sipena-secret" element={<AdminRoute><Admin /></AdminRoute>} />
          <Route path="/admin-scan" element={<AdminRoute><AdminScan /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;