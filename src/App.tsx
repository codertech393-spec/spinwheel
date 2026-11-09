import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Spin from './pages/Spin';
import Track from './pages/Track';
import Rewards from './pages/Rewards';
import Winners from './pages/Winners';
import HowItWorks from './pages/HowItWorks';
import FAQ from './pages/FAQ';
import Contact from './pages/Contact';
import Legal from './pages/Legal';
import NotFound from './pages/NotFound';
import AdminPage from './pages/admin/AdminPage';

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/spin" element={<Spin />} />
        <Route path="/track" element={<Track />} />
        <Route path="/track/:code" element={<Track />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/winners" element={<Winners />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/profile" element={<Navigate to="/track" replace />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/official-rules" element={<Legal kind="rules" />} />
        <Route path="/privacy" element={<Legal kind="privacy" />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}
