// ============================================================
// StudySprint - Forgot Password Page
// ============================================================
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { FiMail, FiArrowLeft, FiKey, FiCheckCircle, FiExternalLink } from 'react-icons/fi';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [loginInput, setLoginInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetData, setResetData] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResetData(null);

    if (!loginInput.trim()) {
      setError('Please enter your registered email address or username.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { login: loginInput.trim() });
      setResetData(response.data);
    } catch (err) {
      const msg = err.response?.data?.message || 'Unable to process reset request. Please check your input.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">SS</span>
          <h1>Reset Password</h1>
          <p>Enter your email or username to recover your account</p>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {resetData ? (
          <div className="reset-success-box">
            <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FiCheckCircle size={18} />
              <span>{resetData.message}</span>
            </div>

            <div className="token-preview-card" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--hairline)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                <strong>Account:</strong> {resetData.email}
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
                Single-use security token generated (valid for {resetData.expiresIn}):
              </p>
              <div style={{ wordBreak: 'break-all', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', background: '#ffffff', padding: '0.6rem', border: '1px solid var(--hairline)', marginBottom: '1rem' }}>
                {resetData.token}
              </div>

              <button
                type="button"
                className="btn-primary"
                onClick={() => navigate(resetData.resetUrl)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <FiKey size={18} />
                <span>Continue to Set New Password</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div className="form-group">
              <label htmlFor="loginInput">Email Address or Username</label>
              <div className="input-wrapper">
                <FiMail className="input-icon" />
                <input
                  type="text"
                  id="loginInput"
                  placeholder="e.g. student@studysprint.com or username"
                  value={loginInput}
                  onChange={(e) => {
                    setLoginInput(e.target.value);
                    setError('');
                  }}
                  autoFocus
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <span className="btn-loading">Verifying Account...</span>
              ) : (
                <>
                  <FiKey size={18} />
                  <span>Generate Reset Token</span>
                </>
              )}
            </button>
          </form>
        )}

        <p className="auth-footer" style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <FiArrowLeft size={14} />
          <Link to="/login">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
