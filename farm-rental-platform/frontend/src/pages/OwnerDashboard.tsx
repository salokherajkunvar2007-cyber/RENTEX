import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiTruck, FiClock, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { getOwnerDashboardApi, getBookingsApi, updateBookingStatusApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { Booking, User, Machine } from '../types';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

interface OwnerStats {
  totalMachines: number;
  activeBookings: number;
  pendingRequests: number;
  upcomingReturns: Booking[];
  healthSummary: { healthy: number; dueSoon: number; overdue: number };
}

const StatCard = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  tone: string;
}) => (
  <div className="glass-card flex items-center gap-4 p-5">
    <span className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}>
      {icon}
    </span>
    <div>
      <p className="text-2xl font-semibold text-canopy-900">{value}</p>
      <p className="text-xs text-canopy-500">{label}</p>
    </div>
  </div>
);

const OwnerDashboard = () => {
  const [stats, setStats] = useState<OwnerStats | null>(null);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [dashRes, bookingsRes] = await Promise.all([
        getOwnerDashboardApi(),
        getBookingsApi({ role: 'owner', status: 'pending' }),
      ]);
      setStats(dashRes.data.stats);
      setPendingBookings(bookingsRes.data.bookings);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActingId(id);
    try {
      await updateBookingStatusApi(id, status);
      toast.success(`Booking ${status}`);
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setActingId(null);
    }
  };

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl2 bg-canopy-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-display text-3xl font-semibold text-canopy-900">Owner Dashboard</h1>
      <p className="mt-1 text-sm text-canopy-500">Overview of your equipment and bookings</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          icon={<FiTruck className="text-canopy-700" />}
          label="Total equipment"
          value={stats.totalMachines}
          tone="bg-canopy-100"
        />
        <StatCard
          icon={<FiCheckCircle className="text-canopy-700" />}
          label="Active bookings"
          value={stats.activeBookings}
          tone="bg-canopy-100"
        />
        <StatCard
          icon={<FiClock className="text-harvest-600" />}
          label="Pending requests"
          value={stats.pendingRequests}
          tone="bg-harvest-100"
        />
        <StatCard
          icon={<FiAlertTriangle className="text-clay" />}
          label="Maintenance due"
          value={stats.healthSummary.dueSoon + stats.healthSummary.overdue}
          tone="bg-red-100"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-canopy-900">
            Pending booking requests
          </h2>
          {pendingBookings.length === 0 ? (
            <EmptyState title="All caught up" message="No pending booking requests right now." />
          ) : (
            <div className="space-y-4">
              {pendingBookings.map((b) => {
                const machine = b.machine as Machine;
                const farmer = b.farmer as User;
                return (
                  <div key={b._id} className="glass-card p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-canopy-900">{machine?.name}</p>
                        <p className="text-sm text-canopy-500">
                          {farmer?.name} · {new Date(b.startDate).toLocaleDateString()} –{' '}
                          {new Date(b.endDate).toLocaleDateString()}
                        </p>
                        <p className="mt-1 text-sm font-medium text-canopy-700">
                          ₹{b.totalPrice.toLocaleString('en-IN')}
                        </p>
                        <Link
                          to={`/bookings/${b._id}/agreement`}
                          className="mt-1 inline-block text-xs font-semibold text-canopy-700 underline"
                        >
                          View Agreement
                        </Link>
                      </div>
                      <StatusBadge status={b.status} />
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        disabled={actingId === b._id}
                        onClick={() => handleAction(b._id, 'approved')}
                        className="btn-primary flex-1 !py-2 text-xs"
                      >
                        Accept
                      </button>
                      <button
                        disabled={actingId === b._id}
                        onClick={() => handleAction(b._id, 'rejected')}
                        className="flex-1 rounded-full border-2 border-clay px-3 py-2 text-xs font-semibold text-clay hover:bg-clay hover:text-white"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-canopy-900">
            Upcoming returns (next 7 days)
          </h2>
          {stats.upcomingReturns.length === 0 ? (
            <EmptyState title="Nothing due soon" message="No equipments are due back this week." />
          ) : (
            <div className="space-y-3">
              {stats.upcomingReturns.map((b) => {
                const machine = b.machine as Machine;
                const farmer = b.farmer as User;
                return (
                  <div key={b._id} className="glass-card flex items-center justify-between p-4">
                    <div>
                      <p className="font-semibold text-canopy-900">{machine?.name}</p>
                      <p className="text-sm text-canopy-500">
                        Due {new Date(b.endDate).toDateString()} · Rented by {farmer?.name}
                      </p>
                      <Link
                        to={`/bookings/${b._id}/agreement`}
                        className="mt-1 inline-block text-xs font-semibold text-canopy-700 underline"
                      >
                        View Agreement
                      </Link>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex justify-end">
            <Link to="/owner/machines" className="text-sm font-semibold text-canopy-700 underline">
              Manage all Equipments →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
