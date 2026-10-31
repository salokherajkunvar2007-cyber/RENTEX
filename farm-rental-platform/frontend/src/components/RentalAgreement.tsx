import { useState } from 'react';
import { FiChevronDown, FiShield, FiFileText } from 'react-icons/fi';
import type { PlatformTerms, RentalTerms, PriceBreakdown, PricingUnit } from '../types';

const fuelLabel: Record<string, string> = {
  owner: 'Owner provides fuel',
  renter: 'Renter provides fuel',
  shared: 'Fuel cost shared between owner and renter',
};

const operatorLabel: Record<string, string> = {
  'not-required': 'No operator required — self-drive',
  required: 'A trained operator is required and will be provided by the owner',
  optional: 'Operator available on request',
};

const unitLabel: Record<string, string> = { hour: 'hour', day: 'day', acre: 'acre' };

interface Party {
  name: string;
  phone?: string;
}

interface Props {
  platformTerms: PlatformTerms | null;
  ownerTerms: RentalTerms | null;
  machine: { name: string; machineType: string; brand: string };
  owner: Party;
  renter: Party;
  startDate: string | Date;
  endDate: string | Date;
  durationDays: number;
  pricingUnit: PricingUnit;
  priceBreakdown: PriceBreakdown;
  bookingId?: string;
  acceptedInfo?: { acceptedBy: string; acceptedAt: string; agreementId: string | null } | null;
}

const Section = ({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-canopy-100 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-canopy-800">{title}</span>
        <FiChevronDown
          className={`text-canopy-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-canopy-100 px-4 py-3 text-sm text-canopy-700">{children}</div>}
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between gap-4 py-1 text-sm">
    <span className="text-canopy-500">{label}</span>
    <span className="text-right font-medium text-canopy-800">{value}</span>
  </div>
);

const RentalAgreement = ({
  platformTerms,
  ownerTerms,
  machine,
  owner,
  renter,
  startDate,
  endDate,
  durationDays,
  pricingUnit,
  priceBreakdown,
  bookingId,
  acceptedInfo,
}: Props) => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return (
    <div className="space-y-5">
      {/* Booking-specific information */}
      <div className="rounded-xl bg-canopy-50 p-4">
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-canopy-700">
          <FiFileText size={14} /> Booking details
        </h3>
        {bookingId && <Row label="Booking ID" value={bookingId} />}
        <Row label="Machine" value={`${machine.name} (${machine.brand}, ${machine.machineType})`} />
        <Row label="Owner" value={owner.name} />
        <Row label="Renter" value={renter.name} />
        <Row label="Start date" value={start.toDateString()} />
        <Row label="End date" value={end.toDateString()} />
        <Row label="Duration" value={`${durationDays} day${durationDays > 1 ? 's' : ''}`} />
        <Row label={`Rental price (per ${unitLabel[pricingUnit]})`} value={`₹${priceBreakdown.rentalPrice.toLocaleString('en-IN')}`} />
        {priceBreakdown.deliveryCharge > 0 && (
          <Row label="Delivery charge" value={`₹${priceBreakdown.deliveryCharge.toLocaleString('en-IN')}`} />
        )}
        {priceBreakdown.securityDeposit > 0 && (
          <Row
            label="Security deposit (refundable)"
            value={`₹${priceBreakdown.securityDeposit.toLocaleString('en-IN')}`}
          />
        )}
        <div className="mt-2 border-t border-canopy-200 pt-2">
          <Row
            label="Total payable now"
            value={<span className="text-base text-canopy-900">₹{priceBreakdown.totalPayable.toLocaleString('en-IN')}</span>}
          />
        </div>
      </div>

      {/* Owner-specific terms */}
      <div>
        <h3 className="mb-2 font-display text-sm font-semibold uppercase tracking-wide text-canopy-700">
          Owner's rental terms
        </h3>
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-2 rounded-xl border border-canopy-100 bg-white p-4 sm:grid-cols-2">
            <Row
              label="Minimum rental"
              value={`${ownerTerms?.minimumRentalDays ?? 1} day(s)`}
            />
            <Row
              label="Maximum rental"
              value={ownerTerms?.maximumRentalDays ? `${ownerTerms.maximumRentalDays} day(s)` : 'No limit'}
            />
            <Row label="Fuel" value={fuelLabel[ownerTerms?.fuelResponsibility || 'renter']} />
            <Row label="Operator" value={operatorLabel[ownerTerms?.operatorRequired || 'not-required']} />
            <Row
              label="Delivery"
              value={
                ownerTerms?.deliveryAvailable
                  ? `Available (₹${ownerTerms.deliveryCharge})`
                  : 'Not available — pickup only'
              }
            />
            <Row label="Pickup" value={ownerTerms?.pickupRequired ? 'Required by renter' : 'Not required'} />
          </div>

          {ownerTerms?.usageRestrictions && (
            <Section title="Usage restrictions">{ownerTerms.usageRestrictions}</Section>
          )}
          {ownerTerms?.allowedUsage && (
            <Section title="Allowed agricultural usage">{ownerTerms.allowedUsage}</Section>
          )}
          <Section title="Cancellation policy" defaultOpen>
            {ownerTerms?.cancellationPolicy?.description ||
              'Free cancellation up to 24 hours before the rental start.'}
          </Section>
          <Section title="Damage & responsibility">
            {ownerTerms?.damagePolicy ||
              'The renter is responsible for any damage beyond normal wear and tear.'}
          </Section>
          {ownerTerms?.customTerms && ownerTerms.customTerms.length > 0 && (
            <Section title="Additional owner rules">
              <ul className="list-disc space-y-1 pl-4">
                {ownerTerms.customTerms.map((t, idx) => (
                  <li key={idx}>{t}</li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>

      {/* Platform terms */}
      <div>
        <h3 className="mb-2 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wide text-canopy-700">
          <FiShield size={14} />
          {platformTerms?.title || 'RENTEX Platform Terms & Conditions'}
        </h3>
        <div className="space-y-2">
          {(platformTerms?.sections || []).map((s) => (
            <Section key={s.heading} title={s.heading}>
              {s.body}
            </Section>
          ))}
        </div>
      </div>

      {acceptedInfo && (
        <div className="rounded-xl border border-canopy-200 bg-canopy-50 p-4 text-sm text-canopy-700">
          <p className="font-semibold text-canopy-800">Agreement accepted</p>
          <p className="mt-1">
            Accepted by {acceptedInfo.acceptedBy} on{' '}
            {new Date(acceptedInfo.acceptedAt).toLocaleString()}
          </p>
          {acceptedInfo.agreementId && (
            <p className="mt-1 text-xs text-canopy-500">Agreement ID: {acceptedInfo.agreementId}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default RentalAgreement;
