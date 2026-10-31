import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GiFarmTractor } from 'react-icons/gi';
import { FiCheck } from 'react-icons/fi';
import {
  getMachineByIdApi,
  createBookingApi,
  getPlatformTermsApi,
} from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import { useAuth } from '../context/AuthContext';
import type { Machine, PlatformTerms, User } from '../types';
import AvailabilityCalendar from '../components/AvailabilityCalendar';
import RentalAgreement from '../components/RentalAgreement';

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

const MS_PER_HOUR = 1000 * 60 * 60;
const MS_PER_DAY = MS_PER_HOUR * 24;

const calcRentalPrice = (start: Date, end: Date, amount: number, unit: string) => {
  const diff = end.getTime() - start.getTime();
  if (unit === 'hour') return Math.max(1, Math.ceil(diff / MS_PER_HOUR)) * amount;
  return Math.max(1, Math.ceil(diff / MS_PER_DAY)) * amount;
};

const calcDurationDays = (start: Date, end: Date) =>
  Math.max(1, Math.ceil((end.getTime() - start.getTime()) / MS_PER_DAY));

type Step = 'dates' | 'summary' | 'agreement';

const STEP_ORDER: Step[] = ['dates', 'summary', 'agreement'];
const STEP_LABEL: Record<Step, string> = {
  dates: 'Select dates',
  summary: 'Price breakdown',
  agreement: 'Rental agreement',
};

const BookingPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [machine, setMachine] = useState<Machine | null>(null);
  const [platformTerms, setPlatformTerms] = useState<PlatformTerms | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('dates');
  const [range, setRange] = useState<CalendarValue>(null);
  const [notes, setNotes] = useState('');
  const [requestDelivery, setRequestDelivery] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const [machineRes, termsRes] = await Promise.all([
          getMachineByIdApi(id),
          getPlatformTermsApi().catch(() => null),
        ]);
        setMachine(machineRes.data.machine);
        if (termsRes) setPlatformTerms(termsRes.data.terms);
      } catch (err) {
        toast.error(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const [start, end] = Array.isArray(range) ? range : [null, null];

  const rentalTerms = machine?.rentalTerms;

  const durationDays = start && end ? calcDurationDays(start, end) : 0;
  const rentalPrice = useMemo(() => {
    if (!machine || !start || !end) return 0;
    return calcRentalPrice(start, end, machine.pricing.amount, machine.pricing.unit);
  }, [machine, start, end]);

  const deliveryCharge = requestDelivery && rentalTerms?.deliveryAvailable ? rentalTerms.deliveryCharge : 0;
  const securityDeposit = rentalTerms?.securityDeposit || 0;
  const totalPayable = rentalPrice + deliveryCharge;

  const durationValid =
    !rentalTerms ||
    ((!rentalTerms.minimumRentalDays || durationDays >= rentalTerms.minimumRentalDays) &&
      (!rentalTerms.maximumRentalDays || durationDays <= rentalTerms.maximumRentalDays));

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16">
        <div className="h-80 animate-pulse rounded-xl2 bg-canopy-100" />
      </div>
    );
  }

  if (!machine) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-semibold text-canopy-800">Machine not found</h2>
        <Link to="/search" className="btn-primary mt-6 inline-flex">
          Back to search
        </Link>
      </div>
    );
  }

  const goToSummary = () => {
    if (!start || !end) {
      toast.error('Please select a start and end date');
      return;
    }
    if (!durationValid) {
      const min = rentalTerms?.minimumRentalDays;
      const max = rentalTerms?.maximumRentalDays;
      toast.error(
        max && durationDays > max
          ? `This machine allows a maximum rental of ${max} day(s)`
          : `This machine requires a minimum rental of ${min} day(s)`
      );
      return;
    }
    setStep('summary');
  };

  const handleConfirm = async () => {
    if (!start || !end) return;
    if (!agreed) {
      toast.error('Please accept the rental agreement to continue');
      return;
    }
    setSubmitting(true);
    try {
      await createBookingApi({
        machineId: machine._id,
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        notes,
        requestDelivery,
        agreementAccepted: true,
      });
      toast.success('Booking request sent to the owner!');
      navigate('/user/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const currentIndex = STEP_ORDER.indexOf(step);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
           <div className="mb-6 flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canopy-100 text-canopy-700">
          <GiFarmTractor size={24} />
        </span>

        <div>
          <h1 className="font-display text-2xl font-semibold text-canopy-900">
            Book {machine.name}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            {machine.category?.main && (
              <span className="rounded-full bg-canopy-100 px-3 py-1 text-xs font-semibold text-canopy-700">
                {machine.category.main === 'heavy'
                  ? 'Heavy Equipment'
                  : 'Household Equipment'}
              </span>
            )}

            {machine.category?.sub && (
              <span className="rounded-full bg-canopy-50 px-3 py-1 text-xs capitalize text-canopy-500">
                {machine.category.sub}
              </span>
            )}
          </div>

          <p className="mt-1 text-sm text-canopy-500">
            {machine.location.village}, {machine.location.district}
          </p>
        </div>
      </div>

       
      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-2">
        {STEP_ORDER.map((s, idx) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                idx < currentIndex
                  ? 'bg-canopy-700 text-white'
                  : idx === currentIndex
                  ? 'bg-harvest-500 text-canopy-900'
                  : 'bg-canopy-100 text-canopy-400'
              }`}
            >
              {idx < currentIndex ? <FiCheck size={14} /> : idx + 1}
            </div>
            <span
              className={`hidden text-xs font-medium sm:block ${
                idx <= currentIndex ? 'text-canopy-800' : 'text-canopy-400'
              }`}
            >
              {STEP_LABEL[s]}
            </span>
            {idx < STEP_ORDER.length - 1 && <div className="h-px flex-1 bg-canopy-100" />}
          </div>
        ))}
      </div>

      {step === 'dates' && (
        <div className="grid grid-cols-1 gap-8 md:grid-cols-5">
          <div className="glass-card p-6 md:col-span-3">
            <h2 className="mb-4 font-display text-lg font-semibold text-canopy-800">
              Select rental dates
            </h2>
            <AvailabilityCalendar
              availability={machine.availability}
              value={range}
              onChange={setRange}
              selectRange
            />
            {rentalTerms && (rentalTerms.minimumRentalDays > 1 || rentalTerms.maximumRentalDays) && (
              <p className="mt-3 text-xs text-canopy-500">
                This owner requires a rental of {rentalTerms.minimumRentalDays}
                {rentalTerms.maximumRentalDays ? `–${rentalTerms.maximumRentalDays}` : '+'} day(s).
              </p>
            )}
          </div>

          <div className="glass-card h-fit space-y-5 p-6 md:col-span-2">
            <h2 className="font-display text-lg font-semibold text-canopy-800">Rental details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-canopy-500">Start date</span>
                <span className="font-medium text-canopy-800">{start ? start.toDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-canopy-500">End date</span>
                <span className="font-medium text-canopy-800">{end ? end.toDateString() : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-canopy-500">Rate</span>
                <span className="font-medium text-canopy-800">
                  ₹{machine.pricing.amount} / {machine.pricing.unit}
                </span>
              </div>
            </div>

            {rentalTerms?.deliveryAvailable && (
              <label className="flex items-center gap-2 rounded-xl bg-canopy-50 p-3 text-sm">
                <input
                  type="checkbox"
                  checked={requestDelivery}
                  onChange={(e) => setRequestDelivery(e.target.checked)}
                  className="h-4 w-4 rounded border-canopy-300 text-canopy-700"
                />
                Request delivery (+₹{rentalTerms.deliveryCharge})
              </label>
            )}

            <div>
              <label className="label-text">Notes for the owner (optional)</label>
              <textarea
                className="input-field min-h-20 resize-none"
                placeholder="e.g. Field access instructions, contact time…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button onClick={goToSummary} disabled={!start || !end} className="btn-primary w-full">
              Continue
            </button>
          </div>
        </div>
      )}

      {step === 'summary' && (
        <div className="glass-card mx-auto max-w-xl space-y-5 p-6">
          <h2 className="font-display text-lg font-semibold text-canopy-800">Price breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-canopy-500">
                Rental price ({durationDays} day{durationDays > 1 ? 's' : ''})
              </span>
              <span className="font-medium text-canopy-800">₹{rentalPrice.toLocaleString('en-IN')}</span>
            </div>
            {deliveryCharge > 0 && (
              <div className="flex justify-between">
                <span className="text-canopy-500">Delivery charge</span>
                <span className="font-medium text-canopy-800">₹{deliveryCharge.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between border-t border-canopy-100 pt-2">
              <span className="font-semibold text-canopy-700">Total payable</span>
              <span className="font-semibold text-canopy-900">₹{totalPayable.toLocaleString('en-IN')}</span>
            </div>
            {securityDeposit > 0 && (
              <div className="mt-3 rounded-xl border border-harvest-200 bg-harvest-50 p-3">
                <div className="flex justify-between">
                  <span className="text-harvest-800">Refundable security deposit</span>
                  <span className="font-semibold text-harvest-800">
                    ₹{securityDeposit.toLocaleString('en-IN')}
                  </span>
                </div>
                <p className="mt-1 text-xs text-harvest-700">
                  This is separate from the rental cost above and is refundable per the owner's policy.
                </p>
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('dates')} className="btn-secondary flex-1">
              Back
            </button>
            <button onClick={() => setStep('agreement')} className="btn-primary flex-1">
              Continue to agreement
            </button>
          </div>
        </div>
      )}

      {step === 'agreement' && start && end && (
        <div className="glass-card mx-auto max-w-2xl space-y-6 p-6">
          <h2 className="font-display text-lg font-semibold text-canopy-800">Rental Agreement</h2>
          <RentalAgreement
            platformTerms={platformTerms}
            ownerTerms={rentalTerms || null}
            machine={{ name: machine.name, machineType: machine.machineType, brand: machine.brand }}
            owner={{ name: (machine.owner as User)?.name, phone: (machine.owner as User)?.phone }}
            renter={{ name: user?.name || '', phone: user?.phone }}
            startDate={start}
            endDate={end}
            durationDays={durationDays}
            pricingUnit={machine.pricing.unit}
            priceBreakdown={{
              rentalPrice,
              deliveryCharge,
              securityDeposit,
              totalPayable,
            }}
          />

          <label className="flex items-start gap-3 rounded-xl border border-canopy-200 bg-canopy-50 p-4">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-canopy-300 text-canopy-700"
            />
            <span className="text-sm text-canopy-800">
              I have read and agree to the RENTEX Terms and Conditions and the owner's rental terms.
            </span>
          </label>

          <div className="flex gap-3">
            <button onClick={() => setStep('summary')} className="btn-secondary flex-1">
              Back
            </button>
            <button
              onClick={handleConfirm}
              disabled={submitting || !agreed}
              className="btn-primary flex-1"
            >
              {submitting ? 'Sending request…' : 'Confirm Booking'}
            </button>
          </div>
          <p className="text-center text-xs text-canopy-400">
            The owner must approve your request before it's confirmed.
          </p>
        </div>
      )}
    </div>
  );
};

export default BookingPage;
