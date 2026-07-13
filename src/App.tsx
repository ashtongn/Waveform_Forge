import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Home from './routes/public/Home';
import About from './routes/public/About';
import Training from './routes/public/Training';
import NotFound from './routes/public/NotFound';
import Login from './routes/auth/Login';
import SignUp from './routes/auth/SignUp';
import RequireApproved from './routes/RequireApproved';
import RequireAdmin from './routes/RequireAdmin';
import MemberHome from './routes/member/MemberHome';
import EquipmentTracker from './routes/member/equipment/EquipmentTracker';
import KanbanBoard from './routes/member/kanban/KanbanBoard';
import AdminHome from './routes/admin/AdminHome';

export default function App() {
  return (
    <Routes>
      {/* Full-bleed Home page */}
      <Route element={<Layout bleed />}>
        <Route index element={<Home />} />
      </Route>

      {/* Standard-width shell: public + auth pages */}
      <Route element={<Layout />}>
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<SignUp />} />

        <Route path="404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>

      {/* Wide public shell: immersive, education-only training page */}
      <Route element={<Layout wide />}>
        <Route path="training" element={<Training />} />
      </Route>

      {/* Wide shell: signed-in app areas (member + admin) */}
      <Route element={<Layout wide />}>
        {/* Approved members only */}
        <Route element={<RequireApproved />}>
          <Route path="app" element={<MemberHome />} />
          <Route path="app/equipment" element={<EquipmentTracker />} />
          <Route path="app/kanban" element={<KanbanBoard />} />
        </Route>

        {/* Admin only */}
        <Route element={<RequireAdmin />}>
          <Route path="admin" element={<AdminHome />} />
        </Route>
      </Route>
    </Routes>
  );
}
