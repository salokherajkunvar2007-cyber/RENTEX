import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { FiCamera } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { updateProfileApi, changePasswordApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    village: user?.village || '',
    district: user?.district || '',
    address: user?.address || '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePhoto || '');
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [savingPw, setSavingPw] = useState(false);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (photoFile) formData.append('profilePhoto', photoFile);
      const { data } = await updateProfileApi(formData);
      setUser(data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSavingPw(true);
    try {
      await changePasswordApi(pwForm);
      toast.success('Password changed');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-canopy-900">Profile</h1>
      <p className="mt-1 text-sm text-canopy-500">Manage your account details</p>

      <form onSubmit={handleProfileSubmit} className="glass-card mt-8 space-y-5 p-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-canopy-100 text-2xl font-semibold text-canopy-700">
              {photoPreview ? (
                <img src={photoPreview} alt="" className="h-full w-full object-cover" />
              ) : (
                user.name[0]
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-canopy-700 text-white shadow">
              <FiCamera size={13} />
              <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-canopy-900">{user.name}</p>
            <p className="text-sm capitalize text-canopy-500">{user.role}</p>
            <p className="text-xs text-canopy-400">{user.email}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text">Full name</label>
            <input className="input-field" value={form.name} onChange={update('name')} />
          </div>
          <div>
            <label className="label-text">Phone</label>
            <input className="input-field" value={form.phone} onChange={update('phone')} />
          </div>
          <div>
            <label className="label-text">Village</label>
            <input className="input-field" value={form.village} onChange={update('village')} />
          </div>
          <div>
            <label className="label-text">District</label>
            <input className="input-field" value={form.district} onChange={update('district')} />
          </div>
        </div>
        <div>
          <label className="label-text">Address</label>
          <input className="input-field" value={form.address} onChange={update('address')} />
        </div>

        <button type="submit" disabled={savingProfile} className="btn-primary w-full sm:w-auto">
          {savingProfile ? 'Saving…' : 'Save profile'}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="glass-card mt-8 space-y-5 p-6">
        <h2 className="font-display text-lg font-semibold text-canopy-900">Change password</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text">Current password</label>
            <input
              type="password"
              required
              className="input-field"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            />
          </div>
          <div>
            <label className="label-text">New password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            />
          </div>
        </div>
        <button type="submit" disabled={savingPw} className="btn-secondary w-full sm:w-auto">
          {savingPw ? 'Updating…' : 'Update password'}
        </button>
      </form>
    </div>
  );
};

export default Profile;
