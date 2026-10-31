import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiClipboard, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { getFarmerDashboardApi, cancelBookingApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { Booking, Machine, User } from '../types';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';

interface FarmerStats {
  totalBookings: number;
  activeCount: number;
  pendingCount: number;
  upcomingRentals: Booking[];
  bookingHistory: Booking[];
  recentBookings: Booking[];
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
  <div className="glass-card flex items-center gap-4 p-5 transition hover:-translate-y-1">
    <span className={`flex h-11 w-11 items-center justify-center rounded-full ${tone}`}>
      {icon}
    </span>
    <div>
      <p className="text-2xl font-semibold text-canopy-900">{value}</p>
      <p className="text-xs text-canopy-500">{label}</p>
    </div>
  </div>
);

const BookingRow = ({ booking, onCancel }: { booking: Booking; onCancel?: () => void }) => {
  const machine = booking.machine as Machine;
  const owner = booking.owner as User;
  return (
    <div className="glass-card flex items-center justify-between gap-4 p-4">
      <div>
        <div>
  <p className="font-semibold text-canopy-900">
    {machine?.name || 'Equipment'}
  </p>

  {machine?.category?.main && (
    <div className="mt-1 flex flex-wrap items-center gap-2">
      <span className="rounded-full bg-canopy-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-canopy-700">
        {machine.category.main === 'heavy'
          ? 'Heavy Equipment'
          : 'Household Equipment'}
      </span>

      {machine.category.sub && (
        <span className="text-xs capitalize text-canopy-500">
          {machine.category.sub}
        </span>
      )}
    </div>
  )}
</div>
        <p className="text-sm text-canopy-500">
          {new Date(booking.startDate).toLocaleDateString()} –{' '}
          {new Date(booking.endDate).toLocaleDateString()} · Owner: {owner?.name}
        </p>
        <p className="mt-1 text-sm font-medium text-canopy-700">
          ₹{booking.totalPrice.toLocaleString('en-IN')}
        </p>
      </div>
      <div className="flex flex-col items-end gap-2">
        <StatusBadge status={booking.status} />
        <Link to={`/bookings/${booking._id}/agreement`} className="text-xs font-semibold text-canopy-700 underline">
          View Agreement
        </Link>
        {onCancel && ['pending', 'approved'].includes(booking.status) && (
          <button onClick={onCancel} className="text-xs font-semibold text-clay underline">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

const FarmerDashboard = () => {
  const [stats, setStats] = useState<FarmerStats | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getFarmerDashboardApi();
      setStats(data.stats);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Cancel this booking?')) return;
    try {
      await cancelBookingApi(id);
      toast.success('Booking cancelled');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading || !stats) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl2 bg-canopy-100" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-canopy-900">
            RENTEX user Dashboard
          </h1>
          <p className="mt-1 text-sm text-canopy-500"> Manage your equipment rentals and bookings in one place</p>
        </div>
        <Link to="/search" className="btn-primary">
          Find equipment
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          icon={<FiClipboard className="text-canopy-700" />}
          label="Total Bookings"
          value={stats.totalBookings}
          tone="bg-canopy-100"
        />
        <StatCard
          icon={<FiCheckCircle className="text-canopy-700" />}
          label="Active Rentals"
          value={stats.activeCount}
          tone="bg-canopy-100"
        />
        <StatCard
          icon={<FiClock className="text-harvest-600" />}
          label="Pending Requests"
          value={stats.pendingCount}
          tone="bg-harvest-100"
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-canopy-900">
            Upcoming Rentals
          </h2>
          {stats.upcomingRentals.length === 0 ? (
            <EmptyState
              icon={<FiClock size={40} />}
              title="No upcoming rentals"
              message="Your approved future bookings will appear here."
            />
          ) : (
            <div className="space-y-3">
              {stats.upcomingRentals.map((b) => (
                <BookingRow key={b._id} booking={b} onCancel={() => handleCancel(b._id)} />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="mb-4 font-display text-xl font-semibold text-canopy-900">
            Booking History
          </h2>
          {stats.bookingHistory.length === 0 ? (
            <EmptyState
              icon={<FiXCircle size={40} />}
              title="No Booking History"
              message="Completed, cancelled and rejected bookings will appear here."
            />
          ) : (
            <div className="space-y-3">
              {stats.bookingHistory.slice(0, 6).map((b) => (
                <BookingRow key={b._id} booking={b} />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-10">
        <h2 className="mb-4 font-display text-xl font-semibold text-canopy-900">Recent Bookings</h2>
        {stats.recentBookings.length === 0 ? (
          <EmptyState title="No Recent Booking" message="Your latest booking requests will show up here." />
        ) : (
          <div className="space-y-3">
            {stats.recentBookings.map((b) => (
              <BookingRow key={b._id} booking={b} onCancel={() => handleCancel(b._id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FarmerDashboard;
