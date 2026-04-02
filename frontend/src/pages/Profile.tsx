import { useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Profile() {
  const { user, refresh } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initials = useMemo(() => {
    if (!user?.email) return 'U';
    return user.email.slice(0, 1).toUpperCase();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-surface-500">Please sign in to view your profile.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (newPassword && newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    if (!username.trim()) {
      setErrorMsg('Username cannot be empty.');
      return;
    }

    if (!email.trim()) {
      setErrorMsg('Email cannot be empty.');
      return;
    }

    const payload: { username?: string; email?: string; current_password?: string; new_password?: string } = {};
    if (username.trim() !== user.username) payload.username = username.trim();
    if (email.trim() !== user.email) payload.email = email.trim();
    if (newPassword) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
    }

    if (!payload.username && !payload.email && !payload.new_password) {
      setErrorMsg('Change username/email or provide a new password to update.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.users.updateProfile(payload);
      await refresh();
      setStatusMsg('Profile updated successfully.');
      setIsEditing(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="mb-8 animate-fade-up">
        <h1 className="font-display text-4xl font-extrabold text-surface-950 tracking-tight">Your Profile</h1>
        <p className="text-surface-400 mt-2 text-sm">Manage and update your account info.</p>
      </div>

      <div className="card-elevated p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center text-3xl font-bold text-primary-500">
            {initials}
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-surface-950">{user.username}</h2>
            <p className="text-sm text-surface-500 mt-1">{user.email}</p>
            <p className="text-sm text-surface-500 mt-1">Joined {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="card-bordered p-4">
            <p className="text-xs uppercase tracking-wider text-surface-400">Username</p>
            <p className="mt-1 text-sm text-surface-800">{user.username}</p>
          </div>
          <div className="card-bordered p-4">
            <p className="text-xs uppercase tracking-wider text-surface-400">Role</p>
            <p className="mt-1 text-sm font-semibold text-surface-800">{user.role}</p>
          </div>
          <div className="card-bordered p-4">
            <p className="text-xs uppercase tracking-wider text-surface-400">User ID</p>
            <p className="mt-1 font-mono text-sm text-surface-800">{user.user_id}</p>
          </div>
        </div>

        {statusMsg && <div className="rounded-xl bg-green-50 text-green-700 p-3 text-sm">{statusMsg}</div>}
        {errorMsg && <div className="rounded-xl bg-red-50 text-red-700 p-3 text-sm">{errorMsg}</div>}

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
                placeholder="Required if changing password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-surface-700">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-surface-200 px-3 py-2 text-sm"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-accent min-w-[120px] !py-2 !rounded-xl"
              >
                {isSubmitting ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setUsername(user.username);
                  setEmail(user.email);
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setErrorMsg('');
                  setStatusMsg('');
                }}
                className="btn-ghost min-w-[120px] !py-2 !rounded-xl"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex justify-end">
            <button
              onClick={() => setIsEditing(true)}
              className="btn-primary !py-2 !rounded-xl"
            >
              Edit profile
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
