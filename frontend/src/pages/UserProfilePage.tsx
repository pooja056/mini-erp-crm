import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Mail, Lock, Shield, Save } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [saving, setSaving] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast('Profile updated successfully', 'success');
    }, 800);
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.newPassword !== formData.confirmPassword) {
      toast('New passwords do not match', 'error');
      return;
    }
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setFormData({ ...formData, currentPassword: '', newPassword: '', confirmPassword: '' });
      toast('Password changed successfully', 'success');
    }, 800);
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>My Profile</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Manage your account settings and preferences.</p>
      </div>

      <div style={{ display: 'grid', gap: '2rem' }}>
        {/* Profile Info */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <User size={20} /> Personal Information
          </h3>
          <form onSubmit={handleUpdateProfile}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              <div className="form-group">
                <label>Full Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <div style={{ 
                  padding: '0.6rem 1rem', 
                  backgroundColor: 'var(--bg-secondary)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <Shield size={16} />
                  {user?.role}
                </div>
              </div>
            </div>
            <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Change Password */}
        <div className="card">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <Lock size={20} /> Change Password
          </h3>
          <form onSubmit={handleChangePassword}>
            <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '400px' }}>
              <div className="form-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={formData.currentPassword}
                  onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={formData.newPassword}
                  onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  className="form-control" 
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  required
                />
              </div>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                Update Password
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
