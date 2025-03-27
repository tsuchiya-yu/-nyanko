import { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import { HeaderProvider } from './context/HeaderContext';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import { initGA, trackPageView } from './lib/analytics';
import CatPhotos from './pages/CatPhotos';
import CatProfile from './pages/CatProfile';
import ColumnDetail from './pages/ColumnDetail';
import Columns from './pages/Columns';
import EditCat from './pages/EditCat';
import Home from './pages/Home';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Privacy from './pages/Privacy';
import RegisterCat from './pages/RegisterCat';
import Terms from './pages/Terms';
import UserProfile from './pages/UserProfile';

export default function App() {
  useSessionRefresh();
  const location = useLocation();

  // Google Analytics初期化
  useEffect(() => {
    initGA();
  }, []);

  // ルート変更時に画面トップにスクロールとページビュートラッキング
  useEffect(() => {
    window.scrollTo(0, 0);
    trackPageView(location.pathname + location.search);
  }, [location.pathname, location.search]);

  return (
    <HeaderProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/profile/:id"
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route path="/cats/:id" element={<CatProfile />} />
          <Route
            path="/cats/:id/edit"
            element={
              <ProtectedRoute>
                <EditCat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/register-cat"
            element={
              <ProtectedRoute>
                <RegisterCat />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cats/:id/photos"
            element={
              <ProtectedRoute>
                <CatPhotos />
              </ProtectedRoute>
            }
          />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/news" element={<News />} />
          <Route path="/news/:slug" element={<NewsDetail />} />
          <Route path="/columns" element={<Columns />} />
          <Route path="/columns/:slug" element={<ColumnDetail />} />
        </Routes>
      </Layout>
    </HeaderProvider>
  );
}
