import React, { useState } from 'react';
import { User, MapPin, Lock, Plus, Trash2, CheckCircle2, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

export const UserProfilePage: React.FC = () => {
  const { user, addresses, refreshProfile, logout, openAuthModal } = useAuth();
  const { success, error: toastError } = useToast();

  // Profile fields
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Address fields
  const [newLabel, setNewLabel] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState('Mumbai');
  const [newPostal, setNewPostal] = useState('400050');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);

  if (!user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <User className="w-12 h-12 text-stone-400 mx-auto" />
        <h2 className="text-lg font-bold text-stone-900">Sign in to view your profile</h2>
        <button
          onClick={() => openAuthModal('login')}
          className="px-5 py-2.5 bg-amber-500 text-stone-950 font-bold rounded-xl text-xs"
        >
          Sign In
        </button>
      </div>
    );
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      await api.users.updateProfile({ name, phone, address });
      await refreshProfile();
      success('Profile details updated successfully');
    } catch (err: any) {
      toastError(err.message || 'Failed to update profile');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim()) {
      toastError('Please enter street address');
      return;
    }
    setSavingAddress(true);
    try {
      await api.users.addAddress({
        label: newLabel,
        street: newStreet.trim(),
        city: newCity.trim(),
        state: 'Maharashtra',
        postal_code: newPostal.trim(),
        is_default: addresses.length === 0,
      });
      await refreshProfile();
      setShowAddAddress(false);
      setNewStreet('');
      success('New delivery address saved');
    } catch (err: any) {
      toastError(err.message || 'Failed to add address');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addrId: string) => {
    try {
      await api.users.deleteAddress(addrId);
      await refreshProfile();
      success('Address removed');
    } catch (err: any) {
      toastError(err.message || 'Failed to remove address');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toastError('New password must be at least 6 characters');
      return;
    }
    setUpdatingPassword(true);
    try {
      await api.users.changePassword({ currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      success('Password changed successfully');
    } catch (err: any) {
      toastError(err.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-800 gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
            Account Center
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-display mt-1">
            Personal Profile & Preferences
          </h1>
        </div>

        <button
          onClick={logout}
          className="self-start sm:self-auto px-4 py-2 border border-rose-800/80 text-rose-400 hover:bg-rose-950/60 rounded-xl text-xs font-bold transition-colors"
        >
          Sign Out
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile & Password */}
        <div className="lg:col-span-7 space-y-6">
          {/* Profile Form */}
          <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center gap-3 border-b border-stone-800 pb-3">
              <div className="w-10 h-10 rounded-full bg-amber-500 text-stone-950 font-extrabold flex items-center justify-center">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">{user.name}</h3>
                <div className="flex items-center gap-2 text-xs text-stone-400">
                  <span>{user.email}</span>
                  {user.role === 'admin' && (
                    <span className="flex items-center gap-1 text-amber-400 font-bold">
                      <Shield className="w-3 h-3" /> Admin
                    </span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Registered Email
                </label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950/60 text-stone-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Primary Delivery Address
                </label>
                <input
                  type="text"
                  placeholder="Street / Flat / Locality"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={updatingProfile}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all disabled:opacity-50 shadow-sm"
              >
                {updatingProfile ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
              <Lock className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Security & Password</h3>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  Current Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-stone-300 block mb-1">
                  New Password (min 6 chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-950 text-white placeholder-stone-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <button
                type="submit"
                disabled={updatingPassword}
                className="w-full py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50 border border-stone-700"
              >
                {updatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Address Book */}
        <div className="lg:col-span-5 bg-stone-900/85 backdrop-blur-xs p-6 rounded-3xl border border-stone-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-400" />
              <h3 className="font-bold text-sm text-white">Saved Delivery Addresses</h3>
            </div>
            <button
              onClick={() => setShowAddAddress(!showAddAddress)}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddAddress ? 'Cancel' : 'Add New'}</span>
            </button>
          </div>

          {showAddAddress && (
            <form onSubmit={handleAddAddress} className="p-4 bg-stone-950 rounded-2xl border border-stone-800 space-y-3">
              <div className="flex gap-2">
                {(['Home', 'Work', 'Other'] as const).map((lbl) => (
                  <button
                    key={lbl}
                    type="button"
                    onClick={() => setNewLabel(lbl)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold border ${
                      newLabel === lbl
                        ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold'
                        : 'bg-stone-900 text-stone-400 border-stone-700'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>

              <input
                type="text"
                required
                placeholder="Street address, building, floor"
                value={newStreet}
                onChange={(e) => setNewStreet(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-900 text-white placeholder-stone-500"
              />

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="City"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-900 text-white placeholder-stone-500"
                />
                <input
                  type="text"
                  required
                  placeholder="PIN code"
                  value={newPostal}
                  onChange={(e) => setNewPostal(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stone-800 bg-stone-900 text-white placeholder-stone-500"
                />
              </div>

              <button
                type="submit"
                disabled={savingAddress}
                className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl text-xs font-bold transition-all"
              >
                {savingAddress ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          )}

          {addresses.length === 0 ? (
            <p className="text-xs text-stone-400 py-4 text-center">
              No saved addresses yet. Add one for 1-click checkout!
            </p>
          ) : (
            <div className="space-y-2.5">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  className="p-3.5 rounded-2xl border border-stone-800 bg-stone-950/70 flex items-start justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white">{addr.label}</span>
                      {addr.is_default && (
                        <span className="text-[10px] text-emerald-300 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Default
                        </span>
                      )}
                    </div>
                    <p className="text-stone-300 leading-snug">{addr.street}</p>
                    <p className="text-stone-500 text-[11px] mt-0.5">
                      {addr.city}, {addr.state} - {addr.postal_code}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDeleteAddress(addr.id)}
                    className="text-stone-400 hover:text-rose-400 p-1"
                    title="Delete Address"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
