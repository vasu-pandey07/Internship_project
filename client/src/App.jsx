import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './app/store';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Notifications from './pages/Notifications';
import PaymentSuccess from './pages/PaymentSuccess';
import CoursePlayer from './pages/CoursePlayer';
import InstructorCourseEditor from './pages/InstructorCourseEditor';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
          <Navbar />
          <main style={{ flex: 1 }}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/courses" element={<Courses />} />
              <Route path="/courses/:id" element={<CourseDetail />} />

              {/* Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>
              } />
              <Route path="/student/courses/:id" element={
                <ProtectedRoute roles={['student']}><CoursePlayer /></ProtectedRoute>
              } />

              {/* Instructor Routes */}
              <Route path="/instructor" element={
                <ProtectedRoute roles={['instructor']}><InstructorDashboard /></ProtectedRoute>
              } />
              <Route path="/instructor/courses/:id" element={
                <ProtectedRoute roles={['instructor']}><InstructorCourseEditor /></ProtectedRoute>
              } />

              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
              } />

              {/* Notifications */}
              <Route path="/notifications" element={
                <ProtectedRoute roles={['student', 'instructor', 'admin']}><Notifications /></ProtectedRoute>
              } />

              {/* Payment callbacks */}
              <Route path="/payment/success" element={<PaymentSuccess />} />
              <Route path="/payment/cancel" element={
                <div className="empty-state" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="empty-state-icon">😕</div>
                  <h3>Payment Cancelled</h3>
                  <p>No worries, you can try again anytime.</p>
                </div>
              } />

              {/* 404 */}
              <Route path="*" element={
                <div className="empty-state" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="empty-state-icon">🔍</div>
                  <h3>Page Not Found</h3>
                  <p>The page you're looking for doesn't exist.</p>
                </div>
              } />
            </Routes>
          </main>
          <Footer />
          <Toaster position="top-right" toastOptions={{
            duration: 3000,
            style: {
              background: 'var(--bg-surface)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              boxShadow: 'var(--shadow-lg)',
            },
          }} />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
