import { useState, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { FiUploadCloud, FiX, FiPlus } from 'react-icons/fi';
import { createMachineApi, updateMachineApi, buildMachineFormData } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { 
  Machine, 
  MachineCondition, 
  PricingUnit, 
  FuelResponsibility, 
  OperatorRequirement, 
  CancellationPolicyType,
  MachineCategoryMain,
} from '../types';
const DEFAULT_RENTAL_TERMS = {
  minimumRentalDays: 1,
  maximumRentalDays: '' as number | '',
  fuelResponsibility: 'renter' as FuelResponsibility,
  operatorRequired: 'not-required' as OperatorRequirement,
  deliveryAvailable: false,
  deliveryCharge: 0,
  pickupRequired: true,
  securityDeposit: 0,
  cancellationPolicyType: 'moderate' as CancellationPolicyType,
  freeCancellationHours: 24,
  cancellationDescription: '',
  damagePolicy: '',
  usageRestrictions: '',
  allowedUsage: '',
};

interface Props {
  existing?: Machine | null;
  onSaved: () => void;
  onCancel: () => void;
}

const MachineForm = ({ existing, onSaved, onCancel }: Props) => {
 const [fields, setFields] = useState({
  name: existing?.name || '',
  machineType: existing?.machineType || '',
  categoryMain: existing?.category?.main || ('heavy' as MachineCategoryMain),
  categorySub: existing?.category?.sub || '',
  brand: existing?.brand || '',
    price: existing?.pricing.amount || 0,
    priceUnit: existing?.pricing.unit || ('day' as PricingUnit),
    village: existing?.location.village || '',
    district: existing?.location.district || '',
    fullAddress: existing?.location.fullAddress || '',
    condition: existing?.condition || ('good' as MachineCondition),
    description: existing?.description || '',
  });
  const [photos, setPhotos] = useState<File[]>([]);
const [existingPhotos, setExistingPhotos] = useState<string[]>(existing?.photos || []);
const [submitting, setSubmitting] = useState(false);

  const [terms, setTerms] = useState({
    ...DEFAULT_RENTAL_TERMS,
    minimumRentalDays: existing?.rentalTerms?.minimumRentalDays ?? DEFAULT_RENTAL_TERMS.minimumRentalDays,
    maximumRentalDays: existing?.rentalTerms?.maximumRentalDays ?? DEFAULT_RENTAL_TERMS.maximumRentalDays,
    fuelResponsibility: existing?.rentalTerms?.fuelResponsibility ?? DEFAULT_RENTAL_TERMS.fuelResponsibility,
    operatorRequired: existing?.rentalTerms?.operatorRequired ?? DEFAULT_RENTAL_TERMS.operatorRequired,
    deliveryAvailable: existing?.rentalTerms?.deliveryAvailable ?? DEFAULT_RENTAL_TERMS.deliveryAvailable,
    deliveryCharge: existing?.rentalTerms?.deliveryCharge ?? DEFAULT_RENTAL_TERMS.deliveryCharge,
    pickupRequired: existing?.rentalTerms?.pickupRequired ?? DEFAULT_RENTAL_TERMS.pickupRequired,
    securityDeposit: existing?.rentalTerms?.securityDeposit ?? DEFAULT_RENTAL_TERMS.securityDeposit,
    cancellationPolicyType:
      existing?.rentalTerms?.cancellationPolicy?.type ?? DEFAULT_RENTAL_TERMS.cancellationPolicyType,
    freeCancellationHours:
      existing?.rentalTerms?.cancellationPolicy?.freeCancellationHours ??
      DEFAULT_RENTAL_TERMS.freeCancellationHours,
    cancellationDescription: existing?.rentalTerms?.cancellationPolicy?.description ?? '',
    damagePolicy: existing?.rentalTerms?.damagePolicy ?? '',
    usageRestrictions: existing?.rentalTerms?.usageRestrictions ?? '',
    allowedUsage: existing?.rentalTerms?.allowedUsage ?? '',
  });
  const [customTerms, setCustomTerms] = useState<string[]>(existing?.rentalTerms?.customTerms ?? []);
  const [newCustomTerm, setNewCustomTerm] = useState('');

  const updateTerm = <K extends keyof typeof terms>(key: K) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const raw = e.target.value;
    const value: any = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : raw;
    setTerms((prev) => ({ ...prev, [key]: value }));
  };

  const addCustomTerm = () => {
    if (!newCustomTerm.trim()) return;
    setCustomTerms((prev) => [...prev, newCustomTerm.trim()]);
    setNewCustomTerm('');
  };

  const update = (key: keyof typeof fields) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setFields((prev) => ({ ...prev, [key]: e.target.value }));

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files).slice(0, 6));
    }
  };
  const removeExistingPhoto = (index: number) => {
  setExistingPhotos((prev) => prev.filter((_, i) => i !== index));
};

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!fields.name || !fields.machineType || !fields.brand || !fields.village || !fields.district) {
      toast.error('Please fill in all required fields');
      return;
    }
    setSubmitting(true);
    try {
      const rentalTermsPayload = {
        minimumRentalDays: Number(terms.minimumRentalDays) || 1,
        maximumRentalDays: terms.maximumRentalDays === '' ? null : Number(terms.maximumRentalDays),
        fuelResponsibility: terms.fuelResponsibility,
        operatorRequired: terms.operatorRequired,
        deliveryAvailable: terms.deliveryAvailable,
        deliveryCharge: Number(terms.deliveryCharge) || 0,
        pickupRequired: terms.pickupRequired,
        securityDeposit: Number(terms.securityDeposit) || 0,
        cancellationPolicy: {
          type: terms.cancellationPolicyType,
          freeCancellationHours: Number(terms.freeCancellationHours) || 0,
          description: terms.cancellationDescription,
        },
        damagePolicy: terms.damagePolicy,
        usageRestrictions: terms.usageRestrictions,
        allowedUsage: terms.allowedUsage,
        customTerms,
      };
      const formData = buildMachineFormData(
  { ...fields, price: Number(fields.price) },
  photos,
  rentalTermsPayload,
  existingPhotos
);
      if (existing) {
        await updateMachineApi(existing._id, formData);
        toast.success('Machine updated');
      } else {
        await createMachineApi(formData);
        toast.success('Machine listed successfully');
      }
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-card space-y-5 p-6">
      <h2 className="font-display text-xl font-semibold text-canopy-900">
        {existing ? 'Edit machine' : 'Add a new machine'}
      </h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label-text">Machine name *</label>
          <input
            required
            className="input-field"
            placeholder="Mahindra 575 DI"
            value={fields.name}
            onChange={update('name')}
          />
        </div>
        <div>
          <label className="label-text">Machine type *</label>
          <input
            required
            className="input-field"
            placeholder="Tractor, Harvester…"
            value={fields.machineType}
            onChange={update('machineType')}
          />
        </div>
        <div>
  <label className="label-text">Equipment category *</label>
  <select
    required
    className="input-field"
    value={fields.categoryMain}
    onChange={update('categoryMain')}
  >
    <option value="heavy">Heavy Equipment</option>
    <option value="household">Household Equipment</option>
  </select>
</div>

<div>
  <label className="label-text">Subcategory</label>
  <input
    className="input-field"
    placeholder={
      fields.categoryMain === 'heavy'
        ? 'Construction, agriculture, industrial…'
        : 'Cleaning, kitchen, home appliances…'
    }
    value={fields.categorySub}
    onChange={update('categorySub')}
  />
</div>
        <div>
          <label className="label-text">Brand *</label>
          <input
            required
            className="input-field"
            placeholder="Mahindra, John Deere…"
            value={fields.brand}
            onChange={update('brand')}
          />
        </div>
        <div>
          <label className="label-text">Condition</label>
          <select className="input-field" value={fields.condition} onChange={update('condition')}>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="needs-service">Needs service</option>
          </select>
        </div>
        <div>
          <label className="label-text">Rental price (₹) *</label>
          <input
            required
            type="number"
            min={1}
            className="input-field"
            value={fields.price}
            onChange={update('price')}
          />
        </div>
        <div>
          <label className="label-text">Price unit</label>
          <select className="input-field" value={fields.priceUnit} onChange={update('priceUnit')}>
            <option value="hour">Per hour</option>
            <option value="day">Per day</option>
            <option value="acre">Per acre</option>
          </select>
        </div>
        <div>
          <label className="label-text">Village *</label>
          <input
            required
            className="input-field"
            value={fields.village}
            onChange={update('village')}
          />
        </div>
        <div>
          <label className="label-text">District *</label>
          <input
            required
            className="input-field"
            value={fields.district}
            onChange={update('district')}
          />
        </div>
      </div>

      <div>
        <label className="label-text">Full address</label>
        <input
          className="input-field"
          placeholder="Landmark, road, pincode…"
          value={fields.fullAddress}
          onChange={update('fullAddress')}
        />
      </div>

      <div>
        <label className="label-text">Description</label>
        <textarea
          className="input-field min-h-24 resize-none"
          placeholder="Describe the machine's capacity, attachments, etc."
          value={fields.description}
          onChange={update('description')}
        />
      </div>

      <div className="rounded-xl border border-canopy-100 bg-canopy-50/50 p-4">
        <h3 className="font-display text-base font-semibold text-canopy-900">Rental terms</h3>
        <p className="mb-4 mt-1 text-xs text-canopy-500">
          These are shown to renters before they book, as part of the rental agreement.
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label-text">Minimum rental (days)</label>
            <input
              type="number"
              min={1}
              className="input-field"
              value={terms.minimumRentalDays}
              onChange={updateTerm('minimumRentalDays')}
            />
          </div>
          <div>
            <label className="label-text">Maximum rental (days, optional)</label>
            <input
              type="number"
              min={1}
              className="input-field"
              placeholder="No limit"
              value={terms.maximumRentalDays}
              onChange={updateTerm('maximumRentalDays')}
            />
          </div>
          <div>
            <label className="label-text">Fuel responsibility</label>
            <select className="input-field" value={terms.fuelResponsibility} onChange={updateTerm('fuelResponsibility')}>
              <option value="renter">Renter provides fuel</option>
              <option value="owner">Owner provides fuel</option>
              <option value="shared">Shared</option>
            </select>
          </div>
          <div>
            <label className="label-text">Operator requirement</label>
            <select className="input-field" value={terms.operatorRequired} onChange={updateTerm('operatorRequired')}>
              <option value="not-required">Not required — self-drive</option>
              <option value="required">Required (owner provides)</option>
              <option value="optional">Optional</option>
            </select>
          </div>
          <div>
            <label className="label-text">Security deposit (₹)</label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={terms.securityDeposit}
              onChange={updateTerm('securityDeposit')}
            />
          </div>
          <div>
            <label className="label-text">Cancellation policy</label>
            <select
              className="input-field"
              value={terms.cancellationPolicyType}
              onChange={updateTerm('cancellationPolicyType')}
            >
              <option value="flexible">Flexible</option>
              <option value="moderate">Moderate</option>
              <option value="strict">Strict</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm text-canopy-700">
            <input
              type="checkbox"
              checked={terms.deliveryAvailable}
              onChange={updateTerm('deliveryAvailable')}
              className="h-4 w-4 rounded border-canopy-300"
            />
            Delivery available
          </label>
          {terms.deliveryAvailable && (
            <input
              type="number"
              min={0}
              className="input-field w-40"
              placeholder="Delivery charge (₹)"
              value={terms.deliveryCharge}
              onChange={updateTerm('deliveryCharge')}
            />
          )}
          <label className="flex items-center gap-2 text-sm text-canopy-700">
            <input
              type="checkbox"
              checked={terms.pickupRequired}
              onChange={updateTerm('pickupRequired')}
              className="h-4 w-4 rounded border-canopy-300"
            />
            Renter must pick up
          </label>
        </div>

        <div className="mt-4">
          <label className="label-text">Cancellation policy details</label>
          <textarea
            className="input-field min-h-16 resize-none"
            placeholder="e.g. Free cancellation up to 24 hours before rental start…"
            value={terms.cancellationDescription}
            onChange={updateTerm('cancellationDescription')}
          />
        </div>

        <div className="mt-4">
          <label className="label-text">Damage / responsibility policy</label>
          <textarea
            className="input-field min-h-16 resize-none"
            placeholder="Who is responsible for damage beyond normal wear and tear?"
            value={terms.damagePolicy}
            onChange={updateTerm('damagePolicy')}
          />
        </div>

        <div className="mt-4">
          <label className="label-text">Usage restrictions</label>
          <textarea
            className="input-field min-h-16 resize-none"
            placeholder="e.g. Not for use on wet or waterlogged fields"
            value={terms.usageRestrictions}
            onChange={updateTerm('usageRestrictions')}
          />
        </div>

        <div className="mt-4">
          <label className="label-text">Allowed agricultural usage</label>
          <textarea
            className="input-field min-h-16 resize-none"
            placeholder="e.g. Ploughing, tilling, sowing"
            value={terms.allowedUsage}
            onChange={updateTerm('allowedUsage')}
          />
        </div>

        <div className="mt-4">
          <label className="label-text">Additional custom terms</label>
          <div className="flex gap-2">
            <input
              className="input-field"
              placeholder="Add a custom rule and click +"
              value={newCustomTerm}
              onChange={(e) => setNewCustomTerm(e.target.value)}
            />
            <button
              type="button"
              onClick={addCustomTerm}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-canopy-700 text-white"
            >
              <FiPlus size={18} />
            </button>
          </div>
          {customTerms.length > 0 && (
            <ul className="mt-3 space-y-1">
              {customTerms.map((t, idx) => (
                <li
                  key={idx}
                  className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-canopy-700"
                >
                  {t}
                  <button
                    type="button"
                    onClick={() => setCustomTerms((prev) => prev.filter((_, i) => i !== idx))}
                  >
                    <FiX size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

     <div>
  <label className="label-text">
    Photos {existing ? '(manage existing photos)' : '(up to 6)'}
  </label>

  {/* Existing photos */}
  {existing && existingPhotos.length > 0 && (
    <div className="mt-3">
      <p className="mb-2 text-sm font-medium text-canopy-700">
        Current photos
      </p>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {existingPhotos.map((photo, idx) => {
          const imageUrl = photo.startsWith('http')
            ? photo
            : `http://localhost:5000${photo}`;

          return (
            <div
              key={`${photo}-${idx}`}
              className="relative overflow-hidden rounded-xl border border-canopy-100 bg-white"
            >
              <img
                src={imageUrl}
                alt={`Machine ${idx + 1}`}
                className="h-32 w-full object-cover"
              />

              <button
                type="button"
                onClick={() => removeExistingPhoto(idx)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                title="Remove photo"
              >
                <FiX size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  )}

  {/* Upload new photos */}
  <label className="mt-4 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-canopy-200 p-6 text-center hover:border-canopy-400">
    <FiUploadCloud size={24} className="text-canopy-500" />

    <span className="text-sm text-canopy-600">
      Click to add new images
    </span>

    <input
      type="file"
      accept="image/*"
      multiple
      hidden
      onChange={handleFiles}
    />
  </label>

  {/* Newly selected photos */}
  {photos.length > 0 && (
    <div className="mt-3">
      <p className="mb-2 text-sm font-medium text-canopy-700">
        New photos
      </p>

      <div className="flex flex-wrap gap-2">
        {photos.map((f, idx) => (
          <span
            key={idx}
            className="flex items-center gap-1 rounded-full bg-canopy-100 px-3 py-1 text-xs text-canopy-700"
          >
            {f.name}

            <button
              type="button"
              onClick={() =>
                setPhotos((prev) => prev.filter((_, i) => i !== idx))
              }
            >
              <FiX size={12} />
            </button>
          </span>
        ))}
      </div>
    </div>
  )}
</div>

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className="btn-secondary flex-1">
          Cancel
        </button>
        <button type="submit" disabled={submitting} className="btn-primary flex-1">
          {submitting ? 'Saving…' : existing ? 'Save changes' : 'List machine'}
        </button>
      </div>
    </form>
  );
};

export default MachineForm;
