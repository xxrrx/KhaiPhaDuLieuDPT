import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Toast from './components/ui/Toast';
import useAuthStore from './store/authStore';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import TryOnPage from './pages/TryOnPage';
import AIStylistPage from './pages/AIStylistPage';
import WardrobePage from './pages/WardrobePage';
import TrendsPage from './pages/TrendsPage';
import SocialFeedPage from './pages/SocialFeedPage';
import ProfilePage from './pages/ProfilePage';
import NotFoundPage from './pages/NotFoundPage';
// Sprint test routes — xóa sau khi pass
import SegmentationTest from './components/tryon/SegmentationTest';
import PoseTest from './components/tryon/PoseTest';
import WarpTest from './components/tryon/WarpTest';
import ARWebcamView from './components/tryon/ARWebcamView';
import { CLOTHING_TYPES } from './utils/clothingWarper';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 5 * 60 * 1000 } },
});

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function AppLayout() {
  const location = useLocation();
  const noNavRoutes = ['/login', '/register'];
  const showNav = !noNavRoutes.includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950">
      {showNav && <Navbar />}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/tryon" element={<ProtectedRoute><TryOnPage /></ProtectedRoute>} />
          <Route path="/ai-stylist" element={<ProtectedRoute><AIStylistPage /></ProtectedRoute>} />
          <Route path="/wardrobe" element={<ProtectedRoute><WardrobePage /></ProtectedRoute>} />
          <Route path="/trends" element={<ProtectedRoute><TrendsPage /></ProtectedRoute>} />
          <Route path="/social" element={<ProtectedRoute><SocialFeedPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          <Route path="/social/users/:id" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
          {/* Sprint test routes — xóa sau khi tất cả pass */}
          <Route path="/test/segmentation" element={<SegmentationTest />} />
          <Route path="/test/pose" element={<PoseTest />} />
          <Route path="/test/warp" element={<WarpTest />} />
          <Route path="/test/ar" element={
            <div className="max-w-2xl mx-auto p-4 space-y-3">
              <div className="bg-zinc-800 rounded-xl p-3 border border-zinc-700">
                <p className="text-sm font-semibold text-zinc-300">Bước 7+8 — AR Full Test</p>
                <p className="text-xs text-zinc-500 mt-0.5">Pose guide • Confidence bar • Drag adjust • Background • Capture</p>
              </div>
              <ARWebcamView
                product={{ id: 'test', name: 'Áo Test (mock)', image_url: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=80' }}
                clothingType={CLOTHING_TYPES.TOP}
              />
            </div>
          } />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      {showNav && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
        <Toast />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
