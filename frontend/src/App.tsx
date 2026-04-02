import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Listings from './pages/Listings';
import NewListing from './pages/NewListing';
import MyListings from './pages/MyListings';
import MyClaims from './pages/MyClaims';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/listings"
              element={<ProtectedRoute><Listings /></ProtectedRoute>}
            />
            <Route
              path="/new-listing"
              element={<ProtectedRoute><NewListing /></ProtectedRoute>}
            />
            <Route
              path="/my-listings"
              element={<ProtectedRoute><MyListings /></ProtectedRoute>}
            />
            <Route
              path="/my-claims"
              element={<ProtectedRoute><MyClaims /></ProtectedRoute>}
            />
            <Route
              path="/notifications"
              element={<ProtectedRoute><Notifications /></ProtectedRoute>}
            />
            <Route
              path="/profile"
              element={<ProtectedRoute><Profile /></ProtectedRoute>}
            />
            <Route
              path="*"
              element={
                <div className="text-center py-28">
                  <h1 className="font-display text-6xl font-extrabold text-surface-200">404</h1>
                  <p className="text-surface-400 mt-3 text-sm">Page not found</p>
                </div>
              }
            />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
