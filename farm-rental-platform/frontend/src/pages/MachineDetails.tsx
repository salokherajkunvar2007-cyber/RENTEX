import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiMapPin, FiStar, FiPhone, FiTool } from 'react-icons/fi';
import { GiFarmTractor } from 'react-icons/gi';
import { getMachineByIdApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Machine, User } from '../types';
import AvailabilityCalendar from '../components/AvailabilityCalendar';

const unitLabel: Record<string, string> = { hour: '/ hour', day: '/ day', acre: '/ acre' };
const conditionLabel: Record<string, string> = {
  excellent: 'Excellent',
  good: 'Good',
  fair: 'Fair',
  'needs-service': 'Needs service',
};

const MachineDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePhoto, setActivePhoto] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data } = await getMachineByIdApi(id);
        setMachine(data.machine);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <div className="h-96 animate-pulse rounded-xl2 bg-canopy-100" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-semibold text-canopy-800">
          Machine not found
        </h2>
        <Link to="/search" className="btn-primary mt-6 inline-flex">
          Back to search
        </Link>
      </div>
    );
  }

  const owner = machine.owner as User;

  const handleBookClick = () => {
    if (!user) {
      toast('Please log in as a Renter to book this machine.');
      navigate('/login', { state: { from: { pathname: `/machines/${machine._id}/book` } } });
      return;
    }
    if (user.role !== 'farmer') {
      toast.error('Only user accounts can book machines.');
      return;
    }
    navigate(`/machines/${machine._id}/book`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
        {/* Photos */}
        <div className="lg:col-span-3">
          <div className="h-80 w-full overflow-hidden rounded-xl2 bg-canopy-100 sm:h-96">
            {machine.photos.length > 0 ? (
              <img
                src={machine.photos[activePhoto]}
                alt={machine.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-canopy-400">
                <GiFarmTractor size={72} />
              </div>
            )}
          </div>
          {machine.photos.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {machine.photos.map((p, idx) => (
                <button
                  key={p}
                  onClick={() => setActivePhoto(idx)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                    idx === activePhoto ? 'border-canopy-700' : 'border-transparent'
                  }`}
                >
                  <img src={p} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="glass-card mt-8 p-6">
            <h2 className="font-display text-xl font-semibold text-canopy-900">Description</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-canopy-700">
              {machine.description || 'No additional description provided.'}
            </p>

            <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-canopy-400">Brand</p>
                <p className="font-medium text-canopy-800">{machine.brand}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-canopy-400">Type</p>
                <p className="font-medium capitalize text-canopy-800">{machine.machineType}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-canopy-400">Condition</p>
                <p className="flex items-center gap-1 font-medium text-canopy-800">
                  <FiTool size={14} /> {conditionLabel[machine.condition]}
                </p>
              </div>
            </div>
          </div>

          <div className="glass-card mt-8 p-6">
            <h2 className="font-display text-xl font-semibold text-canopy-900">
              Availability calendar
            </h2>
            <p className="mt-1 text-sm text-canopy-500">
              Dates in red are already booked. Select your dates on the booking page.
            </p>
            <div className="mt-4">
              <AvailabilityCalendar
                availability={machine.availability}
                value={null}
                onChange={() => {}}
                selectRange={false}
              />
            </div>
          </div>
        </div>

        {/* Booking summary card */}
        <div className="lg:col-span-2">
          <div className="glass-card sticky top-24 space-y-5 p-6">
          <div className="mb-2 flex flex-wrap gap-2">
  <span className="badge badge-approved">
    {machine.category.main === 'heavy'
      ? 'Heavy Equipment'
      : 'Household Equipment'}
  </span>

  {machine.category.sub && (
    <span className="rounded-full bg-canopy-100 px-3 py-1 text-xs font-medium capitalize text-canopy-700">
      {machine.category.sub}
    </span>
  )}
</div>  
            <div>
              <h1 className="font-display text-2xl font-semibold text-canopy-900">
                {machine.name}
              </h1>
              <div className="mt-2 flex items-center gap-1 text-sm text-canopy-500">
                <FiMapPin size={14} />
                {machine.location.village}, {machine.location.district}
              </div>
              <div className="mt-2 flex items-center gap-1 text-sm text-harvest-600">
                <FiStar className="fill-harvest-500 text-harvest-500" />
                {machine.rating.average.toFixed(1)} ({machine.rating.count} ratings)
              </div>
            </div>

            <div className="rounded-xl bg-canopy-50 p-4">
              <span className="font-display text-3xl font-semibold text-canopy-800">
                ₹{machine.pricing.amount.toLocaleString('en-IN')}
              </span>
              <span className="ml-1 text-canopy-500">{unitLabel[machine.pricing.unit]}</span>
            </div>

            <button onClick={handleBookClick} className="btn-primary w-full">
              Request booking
            </button>

            <div className="border-t border-canopy-100 pt-4">
              <p className="text-xs uppercase tracking-wide text-canopy-400">Listed by</p>
              <div className="mt-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-canopy-200 text-canopy-700">
                  {owner?.profilePhoto ? (
                    <img src={owner.profilePhoto} alt="" className="h-full w-full object-cover" />
                  ) : (
                    owner?.name?.[0] || 'O'
                  )}
                </div>
                <div>
                  <p className="font-medium text-canopy-800">{owner?.name}</p>
                  {owner?.phone && (
                    <p className="flex items-center gap-1 text-xs text-canopy-500">
                      <FiPhone size={12} /> {owner.phone}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MachineDetails;
