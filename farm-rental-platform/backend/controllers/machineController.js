const asyncHandler = require('express-async-handler');
const fs = require('fs');
const path = require('path');
const Machine = require('../models/Machine');
const MachineHealth = require('../models/MachineHealth');
const Booking = require('../models/Booking');

// Rental terms arrive from the frontend as a JSON string inside multipart form-data
// (since photos require multipart). Parse defensively so a malformed/missing value
// never breaks machine creation or update — it just falls back to schema defaults.
const parseRentalTerms = (raw) => {
  if (!raw) return null;
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (err) {
    return null;
  }
};

const applyRentalTerms = (machine, parsed, { bumpVersion = true } = {}) => {
  if (!parsed) return;
  const rt = machine.rentalTerms || {};
  const numOrKeep = (v, fallback) => (v === '' || v === undefined || v === null ? fallback : Number(v));

  if (parsed.minimumRentalDays !== undefined) rt.minimumRentalDays = numOrKeep(parsed.minimumRentalDays, rt.minimumRentalDays);
  if (parsed.maximumRentalDays !== undefined)
    rt.maximumRentalDays = parsed.maximumRentalDays === '' ? null : numOrKeep(parsed.maximumRentalDays, rt.maximumRentalDays);
  if (parsed.fuelResponsibility !== undefined) rt.fuelResponsibility = parsed.fuelResponsibility;
  if (parsed.operatorRequired !== undefined) rt.operatorRequired = parsed.operatorRequired;
  if (parsed.deliveryAvailable !== undefined) rt.deliveryAvailable = Boolean(parsed.deliveryAvailable);
  if (parsed.deliveryCharge !== undefined) rt.deliveryCharge = numOrKeep(parsed.deliveryCharge, rt.deliveryCharge);
  if (parsed.pickupRequired !== undefined) rt.pickupRequired = Boolean(parsed.pickupRequired);
  if (parsed.securityDeposit !== undefined) rt.securityDeposit = numOrKeep(parsed.securityDeposit, rt.securityDeposit);
  if (parsed.damagePolicy !== undefined) rt.damagePolicy = parsed.damagePolicy;
  if (parsed.usageRestrictions !== undefined) rt.usageRestrictions = parsed.usageRestrictions;
  if (parsed.allowedUsage !== undefined) rt.allowedUsage = parsed.allowedUsage;
  if (Array.isArray(parsed.customTerms)) rt.customTerms = parsed.customTerms.filter(Boolean);

  if (parsed.cancellationPolicy && typeof parsed.cancellationPolicy === 'object') {
    rt.cancellationPolicy = rt.cancellationPolicy || {};
    const cp = parsed.cancellationPolicy;
    if (cp.type !== undefined) rt.cancellationPolicy.type = cp.type;
    if (cp.freeCancellationHours !== undefined)
      rt.cancellationPolicy.freeCancellationHours = numOrKeep(
        cp.freeCancellationHours,
        rt.cancellationPolicy.freeCancellationHours
      );
    if (cp.description !== undefined) rt.cancellationPolicy.description = cp.description;
  }

  // Any material change to owner terms bumps the version so agreements already
  // accepted by renters (stored as historical snapshots) are not retroactively altered.
  if (bumpVersion) rt.termsVersion = (rt.termsVersion || 1) + 1;
  machine.rentalTerms = rt;
};

// Haversine formula (km) for distance-based filtering
const distanceKm = (lat1, lng1, lat2, lng2) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// @desc    Create a machine listing
// @route   POST /api/machines
// @access  Private (owner)
const createMachine = asyncHandler(async (req, res) => {
  const {
  name,
  machineType,
  categoryMain,
categorySub,
  brand,
  price,
  priceUnit,
  village,
  district,
  fullAddress,
  lat,
  lng,
  condition,
  description,
  isActive,
  rentalTerms,
  existingPhotos,
} = req.body;

  if (!name || !machineType || !brand || !price || !village || !district) {
    res.status(400);
    throw new Error('Please provide all required machine details');
  }
  if (!categoryMain) {
  res.status(400);
  throw new Error('Please select a main equipment category');
}

if (!['heavy', 'household'].includes(categoryMain)) {
  res.status(400);
  throw new Error('Invalid equipment category');
}

  let photos = [];
if (req.files && req.files.length > 0) {
  photos = req.files.map(
    (file) => file.path || `/uploads/${file.filename}`
  );
}

  const machine = new Machine({
  owner: req.user._id,
  name,
  machineType,

  category: {
    main: categoryMain,
    sub: categorySub || '',
  },

  brand,
  photos,
    pricing: { amount: price, unit: priceUnit || 'day' },
    location: {
      village,
      district,
      fullAddress: fullAddress || '',
      coordinates: { lat: lat ? Number(lat) : null, lng: lng ? Number(lng) : null },
    },
    condition: condition || 'good',
    description: description || '',
  });

  // New listings start rental terms at version 1 (schema default) — no bump needed.
  const parsedTerms = parseRentalTerms(rentalTerms);
  if (parsedTerms) applyRentalTerms(machine, parsedTerms, { bumpVersion: false });

  await machine.save();
  await MachineHealth.create({ machine: machine._id });

  res.status(201).json({ success: true, machine });
});

// @desc    Get all machines with search & filters
// @route   GET /api/machines
// @access  Public
const getMachines = asyncHandler(async (req, res) => {
  const {
    machineType,
    categoryMain,
    categorySub,
    village,
    district,
    minPrice,
    maxPrice,
    minRating,
    lat,
    lng,
    maxDistanceKm,
    availableFrom,
    availableTo,
    owner,
    search,
    page = 1,
    limit = 12,
  } = req.query;

  const query = { isActive: true };

  if (machineType) query.machineType = new RegExp(machineType, 'i');
  if (categoryMain) {
  query['category.main'] = categoryMain;
}

if (categorySub) {
  query['category.sub'] = new RegExp(categorySub, 'i');
}
  if (village) query['location.village'] = new RegExp(village, 'i');
  if (district) query['location.district'] = new RegExp(district, 'i');
  if (owner) query.owner = owner;
  if (minRating) query['rating.average'] = { $gte: Number(minRating) };
  if (minPrice || maxPrice) {
    query['pricing.amount'] = {};
    if (minPrice) query['pricing.amount'].$gte = Number(minPrice);
    if (maxPrice) query['pricing.amount'].$lte = Number(maxPrice);
  }
 if (search) {
  query.$or = [
    { name: new RegExp(search, 'i') },
    { brand: new RegExp(search, 'i') },
    { machineType: new RegExp(search, 'i') },
    { 'category.main': new RegExp(search, 'i') },
    { 'category.sub': new RegExp(search, 'i') },
  ];
}

  let machines = await Machine.find(query)
    .populate('owner', 'name phone village district rating')
    .sort({ createdAt: -1 });

  // Availability filter: exclude machines with an overlapping booked/blocked range
  if (availableFrom && availableTo) {
    const from = new Date(availableFrom);
    const to = new Date(availableTo);
    machines = machines.filter((m) => {
      const overlap = m.availability.some(
        (slot) => from <= new Date(slot.endDate) && to >= new Date(slot.startDate)
      );
      return !overlap;
    });
  }

  // Distance filter
  if (lat && lng && maxDistanceKm) {
    machines = machines.filter((m) => {
      if (m.location.coordinates.lat == null || m.location.coordinates.lng == null) return true;
      const d = distanceKm(
        Number(lat),
        Number(lng),
        m.location.coordinates.lat,
        m.location.coordinates.lng
      );
      return d <= Number(maxDistanceKm);
    });
  }

  const total = machines.length;
  const start = (Number(page) - 1) * Number(limit);
  const paginated = machines.slice(start, start + Number(limit));

  res.status(200).json({
    success: true,
    count: paginated.length,
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    machines: paginated,
  });
});

// @desc    Get single machine by id
// @route   GET /api/machines/:id
// @access  Public
const getMachineById = asyncHandler(async (req, res) => {
  const machine = await Machine.findById(req.params.id).populate(
    'owner',
    'name phone email village district rating profilePhoto'
  );

  if (!machine) {
    res.status(404);
    throw new Error('Machine not found');
  }

  res.status(200).json({ success: true, machine });
});

// @desc    Update a machine
// @route   PUT /api/machines/:id
// @access  Private (owner of the machine)
const updateMachine = asyncHandler(async (req, res) => {
  try {
    console.log('UPDATE MACHINE BODY:', req.body);
    console.log('UPDATE MACHINE FILES:', req.files);

    const machine = await Machine.findById(req.params.id);

  if (!machine) {
    res.status(404);
    throw new Error('Machine not found');
  }

  if (machine.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this machine');
  }

  const {
    name,
    machineType,
    categoryMain,
    categorySub,
    brand,
    price,
    priceUnit,
    village,
    district,
    fullAddress,
    lat,
    lng,
    condition,
    description,
    isActive,
    rentalTerms,
    existingPhotos,
  } = req.body;

  if (name !== undefined) machine.name = name;

if (machineType !== undefined) {
  machine.machineType = machineType;
}

if (categoryMain !== undefined) {
  if (!['heavy', 'household'].includes(categoryMain)) {
    res.status(400);
    throw new Error('Invalid equipment category');
  }

  machine.category = machine.category || {};
  machine.category.main = categoryMain;
}

if (categorySub !== undefined) {
  machine.category = machine.category || {};
  machine.category.sub = categorySub;
}

if (brand !== undefined) machine.brand = brand;
  if (price !== undefined) machine.pricing.amount = price;
  if (priceUnit !== undefined) machine.pricing.unit = priceUnit;
  if (village !== undefined) machine.location.village = village;
  if (district !== undefined) machine.location.district = district;
  if (fullAddress !== undefined) machine.location.fullAddress = fullAddress;
  if (lat !== undefined) machine.location.coordinates.lat = Number(lat);
  if (lng !== undefined) machine.location.coordinates.lng = Number(lng);
  if (condition !== undefined) machine.condition = condition;
  if (description !== undefined) machine.description = description;
  if (isActive !== undefined) machine.isActive = isActive;

 // Update machine photos
// existingPhotos contains the photos the owner wants to KEEP
let photosToKeep = machine.photos || [];

if (existingPhotos !== undefined) {
  try {
    const parsedExistingPhotos =
      typeof existingPhotos === 'string'
        ? JSON.parse(existingPhotos)
        : existingPhotos;

    if (Array.isArray(parsedExistingPhotos)) {
      photosToKeep = parsedExistingPhotos;
    }
  } catch (err) {
    // Keep the original photos if the value is invalid
    photosToKeep = machine.photos || [];
  }
}

// Find photos that were removed
const oldPhotos = machine.photos || [];
const removedPhotos = oldPhotos.filter(
  (photo) => !photosToKeep.includes(photo)
);

// Delete removed local image files from backend/uploads
for (const photo of removedPhotos) {
  if (typeof photo !== 'string') continue;

  // Only delete local uploaded files
  if (photo.startsWith('/uploads/')) {
    const filename = photo.split(/[\\/]/).pop();

    if (filename) {
      const filePath = path.join(__dirname, '../uploads', filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }
}

// Add newly uploaded photos
const newPhotos =
  req.files && req.files.length > 0
    ? req.files.map(
        (file) => file.path || `/uploads/${file.filename}`
      )
    : [];

machine.photos = [...photosToKeep, ...newPhotos];
  const parsedTerms = parseRentalTerms(rentalTerms);
  if (parsedTerms) applyRentalTerms(machine, parsedTerms, { bumpVersion: true });

     const updated = await machine.save();
    res.status(200).json({ success: true, machine: updated });
  } catch (error) {
    console.error('UPDATE MACHINE ERROR:', error);
    console.error('ERROR MESSAGE:', error.message);
    console.error('ERROR STACK:', error.stack);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}); 

// @desc    Delete a machine
// @route   DELETE /api/machines/:id
// @access  Private (owner of the machine)
const deleteMachine = asyncHandler(async (req, res) => {
  const machine = await Machine.findById(req.params.id);

  if (!machine) {
    res.status(404);
    throw new Error('Machine not found');
  }

  if (machine.owner.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this machine');
  }

  const activeBooking = await Booking.findOne({
    machine: machine._id,
    status: { $in: ['pending', 'approved'] },
  });

  if (activeBooking) {
    res.status(400);
    throw new Error('Cannot delete a machine with active or pending bookings');
  }

  await MachineHealth.findOneAndDelete({ machine: machine._id });
  await machine.deleteOne();

  res.status(200).json({ success: true, message: 'Machine deleted successfully' });
});

// @desc    Get machines belonging to the logged-in owner
// @route   GET /api/machines/mine/list
// @access  Private (owner)
const getMyMachines = asyncHandler(async (req, res) => {
  const machines = await Machine.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.status(200).json({ success: true, count: machines.length, machines });
});

module.exports = {
  createMachine,
  getMachines,
  getMachineById,
  updateMachine,
  deleteMachine,
  getMyMachines,
};
