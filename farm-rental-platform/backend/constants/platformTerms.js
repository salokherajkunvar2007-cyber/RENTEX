// Versioned RENTEX platform-level terms. Bump PLATFORM_TERMS_VERSION whenever the
// text below changes materially — existing bookings store a snapshot of whichever
// version was current when the renter accepted, so past agreements never silently change.

const PLATFORM_TERMS_VERSION = 1;

const PLATFORM_TERMS = {
  version: PLATFORM_TERMS_VERSION,
  title: 'RENTEX Platform Terms & Conditions',
  sections: [
    {
      heading: 'Accurate Information',
      body:
        'Both renters and owners must provide accurate, up-to-date information about themselves and the machinery listed or booked, including contact details, location, and machine condition.',
    },
    {
      heading: 'Responsible Equipment Usage',
      body:
        'Renters must operate rented machinery safely, for its intended agricultural purpose, and in line with any operator or usage requirements set by the owner.',
    },
    {
      heading: 'Prohibited Misuse',
      body:
        'Machinery must not be used for any illegal purpose, sub-let to a third party, taken outside the agreed usage area, or used beyond its rated capacity without the owner\'s written consent.',
    },
    {
      heading: 'Safety Responsibilities',
      body:
        'Renters are responsible for the safe operation of the machine and for following any safety instructions provided at handover. Owners are responsible for providing machinery in safe working condition.',
    },
    {
      heading: 'Booking Rules',
      body:
        'A booking is only confirmed once the owner approves the request. Overlapping bookings for the same machine and dates are not permitted and will be automatically rejected by the platform.',
    },
    {
      heading: 'Cancellation Rules',
      body:
        'Cancellation terms are set by the individual machine owner and are shown as part of this agreement before you book. RENTEX enforces whichever policy the owner has configured for this machine.',
    },
    {
      heading: 'Dispute Reporting',
      body:
        'Any disagreement about machine condition, damage, payment, or service should be reported through RENTEX as soon as possible so it can be reviewed fairly by both parties.',
    },
    {
      heading: 'Fraudulent Activity',
      body:
        'Any attempt to defraud another user or misrepresent a machine, booking, or identity is strictly prohibited and may result in account suspension.',
    },
    {
      heading: 'Platform Responsibilities',
      body:
        'RENTEX provides the marketplace connecting renters and owners. RENTEX facilitates bookings and communication but is not a party to the rental itself.',
    },
    {
      heading: 'User Responsibilities',
      body:
        'Users are responsible for their own conduct, the accuracy of the information they provide, and compliance with all applicable local laws while using the platform.',
    },
  ],
};

module.exports = { PLATFORM_TERMS_VERSION, PLATFORM_TERMS };
