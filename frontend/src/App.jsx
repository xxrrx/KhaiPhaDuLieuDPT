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
