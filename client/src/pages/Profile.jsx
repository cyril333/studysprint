// ============================================================
// StudySprint - User Profile & Password Management Page
// ============================================================
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { 
  FiUser, 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiCheck, 
  FiShield, 
  FiCalendar, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiSave 
} from 'react-icons/fi';

export default function Profile() {
  const { user, updateUser } = useAuth();

  // Active Tab: 'profile' or 'security'
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form State
  const [profileForm, setProfileForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || '',
    username: user?.username || '',
  });

  const [profileErrors, setProfileErrors] = useState({});
  const [profileMessage, setProfileMessage] = useState({ type: '', text: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Account metadata
  const [metaInfo, setMetaInfo] = useState({
    createdAt: user?.createdAt || '',
    updatedAt: user?.updatedAt || '',
    role: user?.role || 'student',
    status: user?.status || 'active'
  });

  // Fetch full user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/users/profile');
        const userData = response.data.user;
        setProfileForm({
          fullName: userData.fullName || '',
          email: userData.email || '',
          username: userData.username || '',
        });
        setMetaInfo({
          createdAt: userData.createdAt || '',
          updatedAt: userData.updatedAt || '',
          role: userData.role || 'student',
          status: userData.status || 'active',
        });
      } catch (err) {
        console.error('Failed to load profile details:', err);
      }
    };

    fetchProfile();
  }, []);

  // Format initials for avatar monogram
  const getInitials = (name) => {
    if (!name) return 'SS';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // --- Profile Validation & Submit ---
  const validateProfileField = (name, value) => {
    let error = '';
    switch (name) {
      case 'fullName':
        if (!value.trim()) error = 'Full name is required.';
        else if (value.trim().length < 2) error = 'Must be at least 2 characters.';
        break;
      case 'email':
        if (!value.trim()) error = 'Email is required.';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) error = 'Invalid email format.';
        break;
      case 'username':
        if (!value.trim()) error = 'Username is required.';
        else if (value.trim().length < 3) error = 'Must be at least 3 characters.';
        else if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) error = 'Only letters, numbers, and underscores.';
        break;
    }
    return error;
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
    setProfileMessage({ type: '', text: '' });
    const err = validateProfileField(name, value);
    setProfileErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileMessage({ type: '', text: '' });

    const newErrors = {};
    Object.keys(profileForm).forEach((key) => {
      const err = validateProfileField(key, profileForm[key]);
      if (err) newErrors[key] = err;
    });

    if (Object.keys(newErrors).length > 0) {
      setProfileErrors(newErrors);
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.put('/users/profile', profileForm);
      const { user: updatedUser, token: newToken, message } = response.data;
      updateUser(updatedUser, newToken);
      setProfileMessage({ type: 'success', text: message });
      setMetaInfo((prev) => ({ ...prev, updatedAt: updatedUser.updatedAt }));
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile. Please try again.';
      setProfileMessage({ type: 'error', text: msg });
    } finally {
      setProfileLoading(false);
    }
  };

  // --- Password Validation & Submit ---
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    setPasswordMessage({ type: '', text: '' });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordMessage({ type: '', text: '' });
    const errors = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Enter your current password.';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Enter a new password.';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Password must be at least 8 characters.';
    }
    if (!passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = 'Confirm your new password.';
    } else if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      errors.confirmNewPassword = 'Passwords do not match.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    setPasswordErrors({});
    setPasswordLoading(true);

    try {
      const response = await api.put('/users/change-password', passwordForm);
      setPasswordMessage({ type: 'success', text: response.data.message });
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: '',
      });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to change password.';
      setPasswordMessage({ type: 'error', text: msg });
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page-container" style={{ maxWidth: '900px', margin: '0 auto' }}>
        
        {/* Profile Header Card */}
        <div className="profile-banner-card">
          <div className="profile-avatar-circle">
            {getInitials(profileForm.fullName)}
          </div>
          <div className="profile-header-info">
            <div className="profile-title-row">
              <h1>{profileForm.fullName || user?.fullName}</h1>
              <span className={`role-badge ${metaInfo.role === 'admin' ? 'role-admin' : 'role-student'}`}>
                {metaInfo.role}
              </span>
              <span className={`status-badge ${metaInfo.status === 'active' ? 'status-active' : 'status-suspended'}`}>
                {metaInfo.status}
              </span>
            </div>
            <p className="profile-subtitle">@{profileForm.username || user?.username} • {profileForm.email || user?.email}</p>
            {metaInfo.createdAt && (
              <p className="profile-meta-date">
                <FiCalendar size={14} style={{ marginRight: '5px' }} />
                Member since: {new Date(metaInfo.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <FiUser size={16} />
            <span>Profile Details</span>
          </button>
          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <FiShield size={16} />
            <span>Password & Security</span>
          </button>
        </div>

        {/* Tab 1: Profile Details */}
        {activeTab === 'profile' && (
          <div className="section-card">
            <div className="section-header">
              <h2>Edit Profile Information</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                Update your account details. Any changes will immediately reflect across StudySprint.
              </p>
            </div>

            {profileMessage.text && (
              <div className={`alert ${profileMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {profileMessage.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                <span>{profileMessage.text}</span>
              </div>
            )}

            <form onSubmit={handleProfileSubmit} noValidate style={{ marginTop: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="fullName">Full Name</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleProfileChange}
                    className={profileErrors.fullName ? 'input-error' : ''}
                    placeholder="Enter your full name"
                  />
                </div>
                {profileErrors.fullName && <span className="field-error">{profileErrors.fullName}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <div className="input-wrapper">
                  <FiMail className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className={profileErrors.email ? 'input-error' : ''}
                    placeholder="Enter your email address"
                  />
                </div>
                {profileErrors.email && <span className="field-error">{profileErrors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div className="input-wrapper">
                  <FiUser className="input-icon" />
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={profileForm.username}
                    onChange={handleProfileChange}
                    className={profileErrors.username ? 'input-error' : ''}
                    placeholder="Enter your username"
                  />
                </div>
                {profileErrors.username && <span className="field-error">{profileErrors.username}</span>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                <div className="readonly-box">
                  <span className="readonly-label">Account Role</span>
                  <span className="readonly-value">{metaInfo.role.toUpperCase()}</span>
                </div>
                <div className="readonly-box">
                  <span className="readonly-label">Account Status</span>
                  <span className="readonly-value">{metaInfo.status.toUpperCase()}</span>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={profileLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <FiSave size={18} />
                <span>{profileLoading ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Password & Security */}
        {activeTab === 'security' && (
          <div className="section-card">
            <div className="section-header">
              <h2>Change Account Password</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                To secure your account, enter your current password followed by a new 8+ character password.
              </p>
            </div>

            {passwordMessage.text && (
              <div className={`alert ${passwordMessage.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {passwordMessage.type === 'success' ? <FiCheckCircle size={18} /> : <FiAlertCircle size={18} />}
                <span>{passwordMessage.text}</span>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} noValidate style={{ marginTop: '1.25rem' }}>
              <div className="form-group">
                <label htmlFor="currentPassword">Current Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    id="currentPassword"
                    name="currentPassword"
                    placeholder="Enter your current password"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowCurrent(!showCurrent)}
                  >
                    {showCurrent ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {passwordErrors.currentPassword && <span className="field-error">{passwordErrors.currentPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="newPassword">New Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showNew ? 'text' : 'password'}
                    id="newPassword"
                    name="newPassword"
                    placeholder="Minimum 8 characters"
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="toggle-password"
                    onClick={() => setShowNew(!showNew)}
                  >
                    {showNew ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
                {passwordErrors.newPassword && <span className="field-error">{passwordErrors.newPassword}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="confirmNewPassword">Confirm New Password</label>
                <div className="input-wrapper">
                  <FiLock className="input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    id="confirmNewPassword"
                    name="confirmNewPassword"
                    placeholder="Confirm your new password"
                    value={passwordForm.confirmNewPassword}
                    onChange={handlePasswordChange}
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
                {passwordErrors.confirmNewPassword && <span className="field-error">{passwordErrors.confirmNewPassword}</span>}
              </div>

              <button type="submit" className="btn-primary" disabled={passwordLoading} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <FiCheck size={18} />
                <span>{passwordLoading ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>
        )}

      </div>
    </>
  );
}
