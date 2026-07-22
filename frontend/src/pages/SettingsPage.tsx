import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { Settings, Building, Bell, Moon, Sun, Monitor, Palette } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    companyName: 'Mini ERP/CRM Inc.',
    address: '123 Business Rd, Tech Park',
    taxId: 'GSTIN123456789',
    email: 'contact@minierp.com',
    emailNotifications: true,
    smsNotifications: false,
  });

  const [saving, setSaving] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast('Settings saved successfully', 'success');
    }, 800);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1>System Settings</h1>
        <p style={{ color: 'var(--text-secondary)' }}>Configure global application preferences and details.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        {/* Settings Navigation / Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--accent-primary)', color: 'var(--text-primary)' }}>
            <Building size={18} /> Company Details
          </button>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem', border: 'none' }}>
            <Palette size={18} /> Appearance
          </button>
          <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '1rem', border: 'none' }}>
            <Bell size={18} /> Notifications
          </button>
        </div>

        {/* Settings Form */}
        <div className="card">
          <form onSubmit={handleSaveSettings}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Building size={20} /> Company Profile
            </h3>
            
            <div style={{ display: 'grid', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="form-group">
                <label>Company Name</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Tax ID / GSTIN</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={formData.taxId}
                  onChange={(e) => setFormData({...formData, taxId: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Official Address</label>
                <textarea 
                  className="form-control" 
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
            </div>

            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Palette size={20} /> Appearance & Theme
            </h3>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={toggleTheme}
                  style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', borderColor: theme === 'light' ? 'var(--accent-primary)' : 'var(--border-color)' }}
                >
                  <Sun size={24} color={theme === 'light' ? 'var(--accent-primary)' : 'currentColor'} />
                  <span style={{ fontWeight: theme === 'light' ? 600 : 400 }}>Light Mode</span>
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={toggleTheme}
                  style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', borderColor: theme === 'dark' ? 'var(--accent-primary)' : 'var(--border-color)' }}
                >
                  <Moon size={24} color={theme === 'dark' ? 'var(--accent-primary)' : 'currentColor'} />
                  <span style={{ fontWeight: theme === 'dark' ? 600 : 400 }}>Dark Mode</span>
                </button>
              </div>
            </div>

            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <Bell size={20} /> Notification Preferences
            </h3>
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  style={{ width: '1.2rem', height: '1.2rem' }}
                  checked={formData.emailNotifications}
                  onChange={(e) => setFormData({...formData, emailNotifications: e.target.checked})}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>Email Notifications</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Receive daily reports and low stock alerts via email.</div>
                </div>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  style={{ width: '1.2rem', height: '1.2rem' }}
                  checked={formData.smsNotifications}
                  onChange={(e) => setFormData({...formData, smsNotifications: e.target.checked})}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>SMS Alerts</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Receive critical alerts on your registered mobile number.</div>
                </div>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
