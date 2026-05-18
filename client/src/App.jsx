import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Deposit from './pages/Deposit';
import Withdraw from './pages/Withdraw';
import History from './pages/History';
import Loan from './pages/Loan';
import AdminDashboard from './pages/AdminDashboard';

const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" />;
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  return user?.role === 'admin' ? children : <Navigate to="/" />;
};

const AuthLayout = () => (
  <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden" style={{ background: '#060810' }}>
    <Outlet />
  </div>
);

const AppLayout = () => {
  const token = localStorage.getItem('token');
  return (
    <>
      {token && <Sidebar />}
      <main
        className={`min-h-screen ${token ? 'lg:ml-60 pt-14 lg:pt-0' : ''}`}
        style={{ background: '#060810' }}
      >
        <div className="max-w-6xl mx-auto px-5 py-8 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>
    </>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>
        <Route element={<AppLayout />}>
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/deposit" element={<PrivateRoute><Deposit /></PrivateRoute>} />
          <Route path="/withdraw" element={<PrivateRoute><Withdraw /></PrivateRoute>} />
          <Route path="/transfer" element={<PrivateRoute><Transfer /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
          <Route path="/loan" element={<PrivateRoute><Loan /></PrivateRoute>} />
          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;