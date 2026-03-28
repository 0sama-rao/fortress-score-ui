import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Alert from '../components/ui/Alert';
import api from '../lib/api';

export default function Settings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      setSuccess('Password changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
    } catch {
      setError('Failed to change password. Check your current password and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold text-text">Settings</h1>

      {/* Account info */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-text mb-4">Account</h2>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary">Name</span>
            <span className="text-text font-medium">{user?.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary">Email</span>
            <span className="text-text font-medium">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-text mb-4">Change Password</h2>
        {success && <Alert variant="success" className="mb-4">{success}</Alert>}
        {error && <Alert variant="error" className="mb-4">{error}</Alert>}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <Input
            id="current-password"
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            id="new-password"
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
          />
          <Button type="submit" isLoading={isLoading}>
            Update Password
          </Button>
        </form>
      </div>
    </div>
  );
}
