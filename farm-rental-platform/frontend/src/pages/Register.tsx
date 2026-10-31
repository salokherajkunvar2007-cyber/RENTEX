import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GiFarmTractor, GiWheat } from 'react-icons/gi';
import { useAuth } from '../context/AuthContext';
import type { Role } from '../types';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>('user');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    village: '',
    district: '',
  });
  const [loading, setLoading] = useState(false);

  const update = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      toast.success(`Account created. Welcome, ${user.name.split(' ')[0]}!`);
      navigate(role === 'owner' ? '/owner/dashboard' : '/user/dashboard', { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[85vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canopy-700 text-cream">
            <GiFarmTractor size={26} />
          </span>
          <h1 className="mt-4 font-display text-3xl font-semibold text-canopy-900">
            Create your account
          </h1>
          <p className="mt-1 text-sm text-canopy-500">Rent machines, or list your own</p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setRole('user')}
            className={`flex flex-col items-center gap-2 rounded-xl2 border-2 p-4 transition-colors ${
              role === 'user'
                ? 'border-canopy-700 bg-canopy-50'
                : 'border-canopy-100 bg-white hover:border-canopy-300'
            }`}
          >
            <GiWheat size={28} className="text-canopy-700" />
            <span className="text-sm font-semibold text-canopy-800">I'm a user</span>
            <span className="text-xs text-canopy-500">Rent machines nearby</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`flex flex-col items-center gap-2 rounded-xl2 border-2 p-4 transition-colors ${
              role === 'owner'
                ? 'border-canopy-700 bg-canopy-50'
                : 'border-canopy-100 bg-white hover:border-canopy-300'
            }`}
          >
            <GiFarmTractor size={28} className="text-canopy-700" />
            <span className="text-sm font-semibold text-canopy-800">I'm a Machine Owner</span>
            <span className="text-xs text-canopy-500">List and rent out equipment</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="glass-card space-y-4 p-6">
          <div>
            <label className="label-text">Full name</label>
            <input
              required
              className="input-field"
              placeholder="Ramesh Kumar"
              value={form.name}
              onChange={update('name')}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">Email</label>
              <input
                type="email"
                required
                className="input-field"
                placeholder="you@example.com"
                value={form.email}
                onChange={update('email')}
              />
            </div>
            <div>
              <label className="label-text">Phone</label>
              <input
                className="input-field"
                placeholder="98765 43210"
                value={form.phone}
                onChange={update('phone')}
              />
            </div>
          </div>
          <div>
            <label className="label-text">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input-field"
              placeholder="At least 6 characters"
              value={form.password}
              onChange={update('password')}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="label-text">Village</label>
              <input
                className="input-field"
                placeholder="Village name"
                value={form.village}
                onChange={update('village')}
              />
            </div>
            <div>
              <label className="label-text">District</label>
              <input
                className="input-field"
                placeholder="District name"
                value={form.district}
                onChange={update('district')}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-canopy-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-canopy-800 underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
