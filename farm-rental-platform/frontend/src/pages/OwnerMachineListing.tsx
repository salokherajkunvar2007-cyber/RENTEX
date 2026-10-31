import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiActivity } from 'react-icons/fi';
import { GiFarmTractor } from 'react-icons/gi';
import { getMyMachinesApi, deleteMachineApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { Machine } from '../types';
import MachineForm from '../components/MachineForm';
import EmptyState from '../components/EmptyState';

const unitLabel: Record<string, string> = { hour: '/ hr', day: '/ day', acre: '/ acre' };

const OwnerMachineListing = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Machine | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await getMyMachinesApi();
      setMachines(data.machines);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this equipment? This cannot be undone.')) return;
    try {
      await deleteMachineApi(id);
      toast.success('Machine deleted');
      load();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const openEdit = (machine: Machine) => {
    setEditing(machine);
    setShowForm(true);
  };

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-canopy-900">My Equipments</h1>
          <p className="mt-1 text-sm text-canopy-500">Manage your heavy & household equipment listings</p>
        </div>
        {!showForm && (
          <button onClick={openAdd} className="btn-primary">
            <FiPlus /> Add equipment
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-10">
          <MachineForm
            existing={editing}
            onSaved={() => {
              setShowForm(false);
              load();
            }}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-64 animate-pulse rounded-xl2 bg-canopy-100" />
          ))}
        </div>
      ) : machines.length === 0 ? (
        <EmptyState
          icon={<GiFarmTractor size={48} />}
          title="No equipments listed yet"
          message="Add your first equipment so people nearby can find and rent it."
          action={
            !showForm && (
              <button onClick={openAdd} className="btn-primary mt-2">
                <FiPlus /> Add equipment
              </button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {machines.map((m) => (
            <div key={m._id} className="glass-card overflow-hidden">
              <Link to={`/machines/${m._id}`} className="block h-40 bg-canopy-100">
                {m.photos[0] ? (
                  <img src={m.photos[0]} alt={m.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-canopy-400">
                    <GiFarmTractor size={40} />
                  </div>
                )}
              </Link>
              <div className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
  <div>
    <h3 className="font-display font-semibold text-canopy-900">{m.name}</h3>

    {m.category?.main && (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-canopy-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-canopy-700">
          {m.category.main === 'heavy'
            ? 'Heavy Equipment'
            : 'Household Equipment'}
        </span>

        {m.category?.sub && (
          <span className="text-xs capitalize text-canopy-500">
            {m.category.sub}
          </span>
        )}
      </div>
    )}
  </div>

  <span
    className={`badge ${m.isActive ? 'badge-approved' : 'badge-cancelled'}`}
  >
    {m.isActive ? 'Active' : 'Inactive'}
  </span>
</div>
                <p className="text-sm text-canopy-500">
                  {m.location.village}, {m.location.district}
                </p>
                <p className="font-display text-lg font-semibold text-canopy-700">
                  ₹{m.pricing.amount} <span className="text-sm font-normal">{unitLabel[m.pricing.unit]}</span>
                </p>
                <div className="flex gap-2 pt-2">
                  <Link
                    to={`/owner/machines/${m._id}/health`}
                    className="btn-secondary flex-1 !px-2 !py-2 text-xs"
                  >
                    <FiActivity size={14} /> Health
                  </Link>
                  <button
                    onClick={() => openEdit(m)}
                    className="btn-secondary flex-1 !px-2 !py-2 text-xs"
                  >
                    <FiEdit2 size={14} /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(m._id)}
                    className="flex-1 rounded-full border-2 border-clay px-2 py-2 text-xs font-semibold text-clay transition-colors hover:bg-clay hover:text-white"
                  >
                    <FiTrash2 size={14} className="mx-auto" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OwnerMachineListing;
