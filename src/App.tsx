import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import ResumeHub from './pages/ResumeHub';
import ContentWorkspace from './pages/ContentWorkspace';
import Tracker from './pages/Tracker';
import Settings from './pages/Settings';

export default function App() {
  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<ResumeHub />} />
          <Route path="/workspace" element={<ContentWorkspace />} />
          <Route path="/tracker" element={<Tracker />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MainLayout>
    </Router>
  );
}
