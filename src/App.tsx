import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import { HeaderProvider } from './context/HeaderContext';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import { initGA, trackPageView } from './lib/analytics';
import CatPhotos from './pages/CatPhotos';
import CatProfile from './pages/CatProfile';
// 遅延ロード用に変更
const ColumnDetail = lazy(() => import('./pages/ColumnDetail'));
const Columns = lazy(() => import('./pages/Columns'));
import EditCat from './pages/EditCat';
import Home from './pages/Home';
import News from './pages/News';
import NewsDetail from './pages/NewsDetail';
import Privacy from './pages/Privacy';
import RegisterCat from './pages/RegisterCat';
import Terms from './pages/Terms';
import UserProfile from './pages/UserProfile';
import { paths } from './utils/paths';

// ローディングコンポーネント
const LoadingFallback = () => (
  <div className="text-center py-12">
    <div
      role="status"
      aria-label="読み込み中"
      className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800 mx-auto"
    />
  </div>
);

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
          <Route path={paths.home()} element={<Home />} />
          <Route
            path={paths.userProfile(':id')}
            element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route path={paths.catProfile(':id')} element={<CatProfile />} />
          <Route
            path={paths.editCat(':id')}
            element={
              <ProtectedRoute>
                <EditCat />
              </ProtectedRoute>
            }
          />
          <Route
            path={paths.registerCat()}
            element={
              <ProtectedRoute>
                <RegisterCat />
              </ProtectedRoute>
            }
          />
          <Route
            path={paths.catPhotos(':id')}
            element={
              <ProtectedRoute>
                <CatPhotos />
              </ProtectedRoute>
            }
          />
          <Route path={paths.terms()} element={<Terms />} />
          <Route path={paths.privacy()} element={<Privacy />} />
          <Route path={paths.news()} element={<News />} />
          <Route path={paths.newsDetail(':slug')} element={<NewsDetail />} />
          <Route
            path={paths.columns()}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <Columns />
              </Suspense>
            }
          />
          <Route
            path={paths.columnDetail(':slug')}
            element={
              <Suspense fallback={<LoadingFallback />}>
                <ColumnDetail />
              </Suspense>
            }
          />
        </Routes>
      </Layout>
    </HeaderProvider>
  );
}
