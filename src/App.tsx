import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import UserProfile from './pages/UserProfile';
import CatProfile from './pages/CatProfile';
import RegisterCat from './pages/RegisterCat';
import EditCat from './pages/EditCat';
import CatPhotos from './pages/CatPhotos';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useSessionRefresh } from './hooks/useSessionRefresh';
import { HeaderProvider } from './context/HeaderContext';

export default function App() {
  useSessionRefresh();

  return (
    <BrowserRouter>
      <HeaderProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile/:id" element={
              <ProtectedRoute>
                <UserProfile />
              </ProtectedRoute>
            } />
            <Route path="/cats/:id" element={<CatProfile />} />
            <Route path="/cats/:id/edit" element={
              <ProtectedRoute>
                <EditCat />
              </ProtectedRoute>
            } />
            <Route path="/register-cat" element={
              <ProtectedRoute>
                <RegisterCat />
              </ProtectedRoute>
            } />
            <Route path="/cats/:id/photos" element={
              <ProtectedRoute>
                <CatPhotos />
              </ProtectedRoute>
            } />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
          </Routes>
        </Layout>
      </HeaderProvider>
    </BrowserRouter>
  );
}