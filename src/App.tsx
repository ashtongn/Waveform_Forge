import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './routes/public/Home';
import About from './routes/public/About';
import NotFound from './routes/public/NotFound';
import Login from './routes/auth/Login';
import SignUp from './routes/auth/SignUp';
import RequireApproved from './routes/RequireApproved';
import RequireAdmin from './routes/RequireAdmin';
import MemberHome from './routes/member/MemberHome';
import EquipmentTracker from './routes/member/equipment/EquipmentTracker';
import AdminHome from './routes/admin/AdminHome';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Public */}
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />

        {/* Approved members only */}
        <Route element={<RequireApproved />}>
          <Route path="app" element={<MemberHome />} />
          <Route path="app/equipment" element={<EquipmentTracker />} />
        </Route>

        {/* Admin only */}
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminHome />} />
        </Route>

        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
    </Routes>
  );
}
