import { getImageUrl } from '../api/imageUrl';
import { Link } from 'react-router-dom';
import { FiMapPin, FiStar } from 'react-icons/fi';
import { GiFarmTractor } from 'react-icons/gi';
import type { Machine } from '../types';

const unitLabel: Record<string, string> = {
  hour: '/ hour',
  day: '/ day',
  acre: '/ acre',
};

const MachineCard = ({ machine }: { machine: Machine }) => {
  const photo = getImageUrl(machine.photos?.[0]);

  return (
    <Link
      to={`/machines/${machine._id}`}
      className="group glass-card overflow-hidden transition-transform hover:-translate-y-1"
    >
      <div className="relative h-44 w-full overflow-hidden bg-canopy-100">
        {photo ? (
          <img
            src={photo}
            alt={machine.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-canopy-400">
            <GiFarmTractor size={56} />
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-canopy-700 shadow-sm">
          {machine.machineType}
        </span>
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-2">
  <div>
    <h3 className="font-display text-lg font-semibold leading-tight text-canopy-900">
      {machine.name}
    </h3>

    {machine.category?.main && (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-canopy-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-canopy-700">
          {machine.category.main === 'heavy'
            ? 'Heavy Equipment'
            : 'Household Equipment'}
        </span>

        {machine.category?.sub && (
          <span className="text-xs capitalize text-canopy-500">
            {machine.category.sub}
          </span>
        )}
      </div>
    )}
  </div>

  <div className="flex shrink-0 items-center gap-1 text-sm text-harvest-600">
    <FiStar className="fill-harvest-500 text-harvest-500" />
    {machine.rating?.average?.toFixed(1) || 'New'}
  </div>
</div>
        <p className="text-sm text-canopy-600">{machine.brand}</p>

        <div className="flex items-center gap-1 text-sm text-canopy-500">
          <FiMapPin size={14} />
          <span>
            {machine.location.village}, {machine.location.district}
          </span>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="font-display text-xl font-semibold text-canopy-700">
            ₹{machine.pricing.amount.toLocaleString('en-IN')}
            <span className="ml-1 text-sm font-normal text-canopy-500">
              {unitLabel[machine.pricing.unit]}
            </span>
          </span>
          <span className="btn-secondary !px-4 !py-2 text-xs">View</span>
        </div>
      </div>
    </Link>
  );
};

export default MachineCard;
