import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Inbox from './pages/Inbox';
import Sent from './pages/Sent';
import Compose from './pages/Compose';
import EmailView from './pages/EmailView';
import Calendar from './pages/Calendar';
import Admin from './pages/Admin';
import Reports from './pages/Reports';
import ReportEmail from './pages/ReportEmail';
import ReportDetail from './pages/ReportDetail';
import Profile from './pages/Profile';
import Drafts from './pages/Drafts';
import TopBar from './components/TopBar';
import Groups from './pages/Groups';
import GroupChat from './pages/GroupChat';
import Footer from './components/Footer';
import Bin from './pages/Bin';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
      <TopBar />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/calendar" element={<ProtectedRoute><Layout><Calendar /></Layout></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Layout><Admin /></Layout></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><Layout><Inbox /></Layout></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Layout><Reports /></Layout></ProtectedRoute>} />
          <Route path="/sent" element={<ProtectedRoute><Layout><Sent /></Layout></ProtectedRoute>} />
          <Route path="/compose" element={<ProtectedRoute><Layout><Compose /></Layout></ProtectedRoute>} />
          <Route path="/emails/:id" element={<ProtectedRoute><Layout><EmailView /></Layout></ProtectedRoute>} />
          <Route path="/emails/:id/report" element={<ProtectedRoute><Layout><ReportEmail /></Layout></ProtectedRoute>} />
          <Route path="/reports/:id" element={<ProtectedRoute><Layout><ReportDetail /></Layout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Layout><Profile /></Layout></ProtectedRoute>} />
          <Route path="/drafts" element={<ProtectedRoute><Layout><Drafts /></Layout></ProtectedRoute>} />
          <Route path="/groups" element={<ProtectedRoute><Layout><Groups /></Layout></ProtectedRoute>} />
          <Route path="/bin" element={<ProtectedRoute><Layout><Bin /></Layout></ProtectedRoute>} />
<Route path="/groups/:id" element={<ProtectedRoute><Layout><GroupChat /></Layout></ProtectedRoute>} />
          <Route path="/" element={<Navigate to="/inbox" />} />
        </Routes>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  );
}