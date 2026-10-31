import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import Splash from './pages/Splash';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import SearchResults from './pages/SearchResults';
import MachineDetails from './pages/MachineDetails';
import BookingPage from './pages/BookingPage';
import AgreementView from './pages/AgreementView';
import OwnerMachineListing from './pages/OwnerMachineListing';
import MachineHealth from './pages/MachineHealth';
import OwnerDashboard from './pages/OwnerDashboard';
import FarmerDashboard from './pages/FarmerDashboard';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex min-h-screen flex-col bg-cream">
    <Navbar />
    <main className="flex-1">{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <Routes>
      <Route path="/" element={<Splash />} />

      <Route
        path="/home"
        element={
          <AppLayout>
            <Home />
          </AppLayout>
        }
      />
      <Route
        path="/login"
        element={
          <AppLayout>
            <Login />
          </AppLayout>
        }
      />
      <Route
        path="/register"
        element={
          <AppLayout>
            <Register />
          </AppLayout>
        }
      />
      <Route
        path="/search"
        element={
          <AppLayout>
            <SearchResults />
          </AppLayout>
        }
      />
      <Route
        path="/machines/:id"
        element={
          <AppLayout>
            <MachineDetails />
          </AppLayout>
        }
      />
      <Route
        path="/machines/:id/book"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={['user']}>
              <BookingPage />
            </ProtectedRoute>
          </AppLayout>
        }
      />

      <Route
        path="/bookings/:id/agreement"
        element={
          <AppLayout>
            <ProtectedRoute>
              <AgreementView />
            </ProtectedRoute>
          </AppLayout>
        }
      />

      <Route
        path="/owner/machines"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={['owner']}>
              <OwnerMachineListing />
            </ProtectedRoute>
          </AppLayout>
        }
      />
      <Route
        path="/owner/machines/:id/health"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={['owner']}>
              <MachineHealth />
            </ProtectedRoute>
          </AppLayout>
        }
      />
      <Route
        path="/owner/dashboard"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={['owner']}>
              <OwnerDashboard />
            </ProtectedRoute>
          </AppLayout>
        }
      />
      <Route
        path="/user/dashboard"
        element={
          <AppLayout>
            <ProtectedRoute allowedRoles={['user']}>
              <FarmerDashboard />
            </ProtectedRoute>
          </AppLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <AppLayout>
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          </AppLayout>
        }
      />

      <Route
        path="*"
        element={
          <AppLayout>
            <NotFound />
          </AppLayout>
        }
      />
    </Routes>
  );
}

export default App;
