import { useEffect, useState, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiTool, FiPhone } from 'react-icons/fi';
import { getMachineHealthApi, updateMachineHealthApi, getMachineByIdApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { MachineHealth as MachineHealthType, Machine } from '../types';
import StatusBadge from '../components/StatusBadge';

const toInputDate = (value: string | null) => (value ? value.slice(0, 10) : '');

const MachineHealth = () => {
  const { id } = useParams<{ id: string }>();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [health, setHealth] = useState<MachineHealthType | null>(null);
  const [form, setForm] = useState({
    lastServiceDate: '',
    nextMaintenanceDate: '',
    engineHours: 0,
    fuelUsage: 0,
    mechanicName: '',
    mechanicMobile: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [machineRes, healthRes] = await Promise.all([
          getMachineByIdApi(id),
          getMachineHealthApi(id),
        ]);
        setMachine(machineRes.data.machine);
        const h: MachineHealthType = healthRes.data.health;
        setHealth(h);
        setForm({
          lastServiceDate: toInputDate(h.lastServiceDate),
          nextMaintenanceDate: toInputDate(h.nextMaintenanceDate),
          engineHours: h.engineHours,
          fuelUsage: h.fuelUsage,
          mechanicName: h.mechanicName,
          mechanicMobile: h.mechanicMobile,
        });
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const { data } = await updateMachineHealthApi(id, form);
      setHealth(data.health);
      toast.success('Machine health updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-96 animate-pulse rounded-xl2 bg-canopy-100" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-canopy-900">
            <FiTool /> Machine Health — {machine?.name}
          </h1>
          <p className="mt-1 text-sm text-canopy-500">
            Track service history and maintenance schedule
          </p>
        </div>
        {health && <StatusBadge status={health.status} />}
        <Link to="/owner/machines" className="hidden text-sm font-semibold text-canopy-700 underline sm:block">
          Back to machines
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="glass-card space-y-5 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text">Last service date</label>
            <input
              type="date"
              className="input-field"
              value={form.lastServiceDate}
              onChange={update('lastServiceDate')}
            />
          </div>
          <div>
            <label className="label-text">Next maintenance date</label>
            <input
              type="date"
              className="input-field"
              value={form.nextMaintenanceDate}
              onChange={update('nextMaintenanceDate')}
            />
          </div>
          <div>
            <label className="label-text">Engine hours</label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={form.engineHours}
              onChange={update('engineHours')}
            />
          </div>
          <div>
            <label className="label-text">Fuel usage (litres since last service)</label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={form.fuelUsage}
              onChange={update('fuelUsage')}
            />
          </div>
          <div>
            <label className="label-text">Mechanic name</label>
            <input
              className="input-field"
              placeholder="Mechanic's full name"
              value={form.mechanicName}
              onChange={update('mechanicName')}
            />
          </div>
          <div>
            <label className="label-text">Mechanic mobile</label>
            <div className="relative">
              <FiPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-canopy-400" />
              <input
                className="input-field pl-9"
                placeholder="98765 43210"
                value={form.mechanicMobile}
                onChange={update('mechanicMobile')}
              />
            </div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="btn-primary w-full">
          {saving ? 'Saving…' : 'Save health record'}
        </button>
      </form>
    </div>
  );
};

export default MachineHealth;
