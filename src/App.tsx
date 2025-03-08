import { Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/auth/ProtectedRoute";
import Layout from "./components/Layout";
import { HeaderProvider } from "./context/HeaderContext";
import { useSessionRefresh } from "./hooks/useSessionRefresh";
import CatPhotos from "./pages/CatPhotos";
import CatProfile from "./pages/CatProfile";
import EditCat from "./pages/EditCat";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import RegisterCat from "./pages/RegisterCat";
import Terms from "./pages/Terms";
import UserProfile from "./pages/UserProfile";

export default function App() {
  useSessionRefresh();

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
        </Routes>
      </Layout>
    </HeaderProvider>
  );
}
