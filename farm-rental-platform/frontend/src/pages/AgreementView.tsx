import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiFileText } from 'react-icons/fi';
import { getBookingByIdApi } from '../api/endpoints';
import { getErrorMessage } from '../api/client';
import type { Booking, User } from '../types';
import StatusBadge from '../components/StatusBadge';
import RentalAgreement from '../components/RentalAgreement';

const AgreementView = () => {
  const { id } = useParams<{ id: string }>();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const { data } = await getBookingByIdApi(id);
        setBooking(data.booking);
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
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="h-96 animate-pulse rounded-xl2 bg-canopy-100" />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <h2 className="font-display text-2xl font-semibold text-canopy-800">Booking not found</h2>
        <Link to="/" className="btn-primary mt-6 inline-flex">
          Back home
        </Link>
      </div>
    );
  }

  const agreement = booking.agreement;
  const hasAgreement = agreement && agreement.status === 'accepted' && agreement.bookingSnapshot;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <Link to="/" onClick={(e) => { e.preventDefault(); window.history.back(); }} className="mb-4 inline-flex items-center gap-1 text-sm font-semibold text-canopy-600">
        <FiArrowLeft size={14} /> Back
      </Link>

      <div className="glass-card p-6 sm:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-canopy-100 text-canopy-700">
              <FiFileText size={20} />
            </span>
            <div>
              <h1 className="font-display text-xl font-semibold text-canopy-900">
                Rental Agreement
              </h1>
              <p className="text-sm text-canopy-500">Booking #{booking._id.slice(-8)}</p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {!hasAgreement ? (
          <div className="rounded-xl border border-dashed border-canopy-200 p-6 text-center text-sm text-canopy-500">
            No digital agreement is on file for this booking. This booking was likely created before
            RENTEX introduced digital rental agreements.
          </div>
        ) : (
          <RentalAgreement
            platformTerms={agreement.platformTermsSnapshot}
            ownerTerms={agreement.ownerTermsSnapshot}
            machine={{
              name: agreement.bookingSnapshot!.machineName,
              machineType: agreement.bookingSnapshot!.machineType,
              brand: agreement.bookingSnapshot!.brand,
            }}
            owner={{ name: agreement.bookingSnapshot!.ownerName, phone: agreement.bookingSnapshot!.ownerPhone }}
            renter={{ name: agreement.bookingSnapshot!.renterName, phone: agreement.bookingSnapshot!.renterPhone }}
            startDate={agreement.bookingSnapshot!.startDate}
            endDate={agreement.bookingSnapshot!.endDate}
            durationDays={agreement.bookingSnapshot!.durationDays}
            pricingUnit={agreement.bookingSnapshot!.pricingUnit}
            priceBreakdown={{
              rentalPrice: agreement.bookingSnapshot!.rentalPrice,
              deliveryCharge: agreement.bookingSnapshot!.deliveryCharge,
              securityDeposit: agreement.bookingSnapshot!.securityDeposit,
              totalPayable: agreement.bookingSnapshot!.totalPayable,
            }}
            bookingId={booking._id}
            acceptedInfo={
              agreement.acceptedAt
                ? {
                    acceptedBy:
                      typeof agreement.acceptedBy === 'object' && agreement.acceptedBy
                        ? (agreement.acceptedBy as User).name
                        : agreement.bookingSnapshot!.renterName,
                    acceptedAt: agreement.acceptedAt,
                    agreementId: agreement.agreementId,
                  }
                : null
            }
          />
        )}

        <p className="mt-6 text-center text-xs text-canopy-400">
          A downloadable PDF version of this agreement is coming soon.
        </p>
      </div>
    </div>
  );
};

export default AgreementView;
