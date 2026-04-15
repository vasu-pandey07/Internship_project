import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import API from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiCheckCircle, FiAlertTriangle } from 'react-icons/fi';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [status, setStatus] = useState('verifying');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        await API.get(`/payments/verify/${sessionId}`);
        setStatus('success');
      } catch (err) {
        setStatus('error');
      }
    };
    verify();
  }, [sessionId]);

  if (status === 'verifying') {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <LoadingSpinner text="Verifying payment..." />
        <p style={{ color: 'var(--text-tertiary)', marginTop: 'var(--space-2)', fontSize: '0.88rem' }}>Please don't close this page.</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <FiAlertTriangle size={48} style={{ color: 'var(--accent-amber)', marginBottom: 'var(--space-4)' }} />
        <h3 style={{ color: 'var(--accent-rose)', marginBottom: 'var(--space-2)' }}>Verification Failed</h3>
        <p>We couldn't verify your payment. Please contact support.</p>
        <Link to="/student" className="btn btn-primary btn-md" style={{ marginTop: 'var(--space-6)' }}>Go to Dashboard</Link>
      </div>
    );
  }

  return (
    <div className="empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%',
        background: 'var(--accent-emerald-soft)', display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 'var(--space-5)', animation: 'pulse-ring 2s infinite',
      }}>
        <FiCheckCircle size={36} style={{ color: 'var(--accent-emerald)' }} />
      </div>
      <h3 style={{ fontSize: '1.35rem', marginBottom: 'var(--space-2)' }}>Payment Successful!</h3>
      <p>You've been successfully enrolled. Let's start learning!</p>
      <Link to="/student" className="btn btn-success btn-md" style={{ marginTop: 'var(--space-6)' }}>Start Learning</Link>
    </div>
  );
};

export default PaymentSuccess;
