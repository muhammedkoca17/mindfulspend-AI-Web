import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Register from './pages/Register';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Market from './pages/Market';
import Cart from './pages/Cart';
import Profile from './pages/Profile';
import Goals from './pages/Goals';
import RfmAnalytics from './pages/RfmAnalytics';
import Layout from './components/Layout';

const PrivateRoute = ({ children }: any) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/" />;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
        {/* Onboarding should be standalone (no sidebar) */}
        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
        
        {/* Main app layout with sidebar - pathless route so children keep their top-level paths */}
        <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/market" element={<Market />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/rfm" element={<RfmAnalytics />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
