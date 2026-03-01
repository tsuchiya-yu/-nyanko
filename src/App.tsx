import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';

import ProtectedRoute from './components/auth/ProtectedRoute';
import Layout from './components/Layout';
import { HeaderProvider } from './context/HeaderContext';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import { initGA, trackPageView } from './lib/analytics';
import Home from './pages/Home';
import { routePatterns } from './utils/paths';

const CatPhotos = lazy(() => import('./pages/CatPhotos'));
const CatProfile = lazy(() => import('./pages/CatProfile'));
const ColumnDetail = lazy(() => import('./pages/ColumnDetail'));
const Columns = lazy(() => import('./pages/Columns'));
const EditCat = lazy(() => import('./pages/EditCat'));
const News = lazy(() => import('./pages/News'));
const NewsDetail = lazy(() => import('./pages/NewsDetail'));
const Privacy = lazy(() => import('./pages/Privacy'));
const RegisterCat = lazy(() => import('./pages/RegisterCat'));
const Terms = lazy(() => import('./pages/Terms'));
const UserProfile = lazy(() => import('./pages/UserProfile'));

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

function LazyRoute({ children }: { children: ReactNode }) {
  return <Suspense fallback={<LoadingFallback />}>{children}</Suspense>;
}

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
          <Route path={routePatterns.home} element={<Home />} />
          <Route
            path={routePatterns.userProfile}
            element={
              <LazyRoute>
                <ProtectedRoute>
                  <UserProfile />
                </ProtectedRoute>
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.catProfile}
            element={
              <LazyRoute>
                <CatProfile />
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.editCat}
            element={
              <LazyRoute>
                <ProtectedRoute>
                  <EditCat />
                </ProtectedRoute>
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.registerCat}
            element={
              <LazyRoute>
                <ProtectedRoute>
                  <RegisterCat />
                </ProtectedRoute>
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.catPhotos}
            element={
              <LazyRoute>
                <ProtectedRoute>
                  <CatPhotos />
                </ProtectedRoute>
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.terms}
            element={
              <LazyRoute>
                <Terms />
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.privacy}
            element={
              <LazyRoute>
                <Privacy />
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.news}
            element={
              <LazyRoute>
                <News />
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.newsDetail}
            element={
              <LazyRoute>
                <NewsDetail />
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.columns}
            element={
              <LazyRoute>
                <Columns />
              </LazyRoute>
            }
          />
          <Route
            path={routePatterns.columnDetail}
            element={
              <LazyRoute>
                <ColumnDetail />
              </LazyRoute>
            }
          />
        </Routes>
      </Layout>
    </HeaderProvider>
  );
}
