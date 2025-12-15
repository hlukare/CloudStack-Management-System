import React, { useState, useEffect } from 'react';
import { authAPI } from '../api/api';
import { User, Camera, Lock, Mail, Save, X, Info, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: user?.username || '',
    email: user?.email || ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Use user.profilePicture directly instead of local state
  const profilePicture = user?.profilePicture;

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await authAPI.updateProfile(profileForm);
      if (response.data && response.data.user) {
        updateUser(response.data.user);
        toast.success('Profile updated successfully. Refreshing page...', { duration: 2000 });
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update profile';
      toast.error(errorMsg);
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      toast.success('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profilePicture', file);
      const response = await authAPI.uploadProfilePicture(formData);
      const updatedUserData = { ...user, profilePicture: response.data.profilePicture };
      updateUser(updatedUserData);
      toast.success('Profile picture uploaded successfully. Refreshing...', { duration: 2000 });
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to upload profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveProfilePicture = async () => {
    if (!confirm('Are you sure you want to remove your profile picture?')) return;
    setLoading(true);
    try {
      await authAPI.removeProfilePicture();
      const updatedUserData = { ...user, profilePicture: null };
      updateUser(updatedUserData);
      toast.success('Profile picture removed successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to remove profile picture');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 px-4">
      <div className="bg-gray-50 border-2 border-gray-300 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-gray-700 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-gray-800">
          <p className="font-semibold mb-1">Account Settings & Security</p>
          <p>Manage your profile information, update your profile picture, change your password, and configure account preferences. Keep your account secure by using a strong password and updating it regularly.</p>
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile Picture Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Profile Picture
        </h2>
        <div className="flex items-center gap-6">
          <div className="relative">
            {profilePicture ? (
              <img src={profilePicture} alt="Profile" className="w-32 h-32 rounded-full object-cover border-4 border-gray-200" />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gray-300 flex items-center justify-center border-4 border-gray-400">
                <span className="text-4xl font-bold text-gray-700">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 mb-3">Upload a profile picture (JPG, PNG, max 5MB)</p>
            <div className="flex gap-2">
              <label className="px-4 py-2 bg-gray-700 text-white hover:bg-gray-800 cursor-pointer inline-flex items-center gap-2 border border-gray-800">
                <Camera className="w-4 h-4" />
                Upload Picture
                <input type="file" accept="image/*" onChange={handleProfilePictureUpload} className="hidden" disabled={loading} />
              </label>
              {profilePicture && (
                <button onClick={handleRemoveProfilePicture} disabled={loading} className="px-4 py-2 bg-gray-200 text-gray-800 hover:bg-gray-300 inline-flex items-center gap-2 border border-gray-400">
                  <X className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          Profile Information
        </h2>
        <form onSubmit={handleProfileUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={profileForm.username}
              onChange={(e) => setProfileForm({...profileForm, username: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Mail className="w-4 h-4" />
              Email
            </label>
            <input
              type="email"
              value={profileForm.email}
              onChange={(e) => setProfileForm({...profileForm, email: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2 border border-gray-800 rounded-lg"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Lock className="w-5 h-5" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
            <input
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={6}
            />
            <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({...profileForm, confirmPassword: e.target.value})}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={6}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-gray-700 text-white hover:bg-gray-800 disabled:opacity-50 inline-flex items-center gap-2 border border-gray-800 rounded-lg"
          >
            <Check className="w-4 h-4" />
            Change Password
          </button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Security Best Practices</h3>
        <ul className="text-sm text-gray-700 space-y-1 ml-4">
          <li>Use a strong password with at least 12 characters including uppercase, lowercase, numbers, and symbols</li>
          <li>Never share your password with anyone</li>
          <li>Change your password regularly (every 90 days recommended)</li>
          <li>Use different passwords for different services</li>
          <li>Enable two-factor authentication if available</li>
        </ul>
      </div>
    </div>
  );
}
