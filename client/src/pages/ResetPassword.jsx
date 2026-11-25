// ============================================================
// StudySprint - Reset Password Page
// ============================================================
import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { FiLock, FiEye, FiEyeOff, FiCheck, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenParam = searchParams.get('token') || '';
  const [token, setToken] = useState(tokenParam);
  const [tokenVerified, setTokenVerified] = useState(false);
  const [tokenError, setTokenError] = useState('');
  const [verifying, setVerifying] = useState(!!tokenParam);
  const [accountInfo, setAccountInfo] = useState(null);

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate token on mount if provided in URL
  useEffect(() => {
    if (tokenParam) {
      verifyToken(tokenParam);
    }
  }, [tokenParam]);

  const verifyToken = async (tokenToVerify) => {
    setVerifying(true);
    setTokenError('');
    try {
      const response = await api.get(`/auth/verify-reset-token/${tokenToVerify.trim()}`);
      if (response.data.valid) {
        setTokenVerified(true);
        setAccountInfo({
          email: response.data.email,
          username: response.data.username
        });
      }
    } catch (err) {
      setTokenVerified(false);
      setTokenError(err.response?.data?.message || 'Invalid or expired reset token.');
    } finally {
      setVerifying(false);
    }
  };

  const handleManualVerify = (e) => {
    e.preventDefault();
    if (!token.trim()) {
      setTokenError('Please enter a reset token.');
      return;
    }
    verifyToken(token);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.newPassword || !formData.confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (formData.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      setSuccess(response.data.message || 'Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. Please request a new token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <span className="auth-logo">SS</span>
          <h1>Set New Password</h1>
          <p>Create a secure new password for your StudySprint account</p>
        </div>

        {verifying && (
          <div className="loading-state" style={{ padding: '2rem 0', textAlign: 'center' }}>
            Validating security token...
          </div>
        )}

        {!verifying && !tokenVerified && (
          <div>
            {tokenError && (
              <div className="alert alert-error" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiAlertTriangle size={18} />
                <span>{tokenError}</span>
              </div>
            )}

            <form onSubmit={handleManualVerify} style={{ marginTop: '1rem' }}>
              <div className="form-group">
                <label htmlFor="tokenInput">Enter Reset Token</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type="text"
                    id="tokenInput"
                    placeholder="Paste your 64-character token"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" className="btn-primary">
                Verify Token
              </button>
            </form>

            <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
              Need a new token? <Link to="/forgot-password">Request Reset Link</Link>
            </p>
          </div>
        )}

        {!verifying && tokenVerified && (
          <div>
            {accountInfo && (
              <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'var(--surface)', border: '1px solid var(--hairline)', fontSize: '0.85rem' }}>
                <strong>Resetting password for:</strong> {accountInfo.username} ({accountInfo.email})
              </div>
            )}

            {error && <div className="alert alert-error">{error}</div>}
            {success && (
              <div className="alert alert-success" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiCheckCircle size={18} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="newPassword"
                    placeholder="Minimum 8 characters"
                    value={formData.newPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, newPassword: e.target.value });
                      setError('');
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="Re-enter your new password"
                    value={formData.confirmPassword}
                    onChange={(e) => {
                      setFormData({ ...formData, confirmPassword: e.target.value });
                      setError('');
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading || !!success}>
                {loading ? (
                  <span className="btn-loading">Updating Password...</span>
                ) : (
                  <>
                    <FiCheck size={18} />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </form>

            <p className="auth-footer" style={{ marginTop: '1.5rem' }}>
              Remember your password? <Link to="/login">Sign In</Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
