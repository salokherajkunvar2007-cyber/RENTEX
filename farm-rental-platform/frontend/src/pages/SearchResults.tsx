import { useEffect, useState, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { GiFarmTractor } from 'react-icons/gi';
import { getMachinesApi } from '../api/endpoints';
import type { Machine } from '../types';
import MachineCard from '../components/MachineCard';
import EmptyState from '../components/EmptyState';

const SearchResults = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
  categoryMain: searchParams.get('categoryMain') || '',
  categorySub: searchParams.get('categorySub') || '',
  search: searchParams.get('search') || '',
  machineType: searchParams.get('machineType') || '',
    village: searchParams.get('village') || '',
    district: searchParams.get('district') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
  });

  const runSearch = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });
      const { data } = await getMachinesApi(params);
      setMachines(data.machines);
    } catch {
      setMachines([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
      if (value) next[key] = value;
    });
    setSearchParams(next);
    runSearch();
  };

  const updateFilter = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold text-canopy-900">Find Equipments</h1>
          <p className="mt-1 text-sm text-canopy-500">
            Search by category, equipment type, location, price and ratings
          </p>
        </div>
        <button
          className="btn-secondary !px-4 !py-2 text-sm md:hidden"
          onClick={() => setShowFilters((prev) => !prev)}
        >
          <FiFilter /> Filters
        </button>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
        <form
          onSubmit={handleSubmit}
          className={`glass-card h-fit space-y-4 p-5 md:col-span-1 ${
            showFilters ? 'block' : 'hidden md:block'
          }`}
        >
          <div>
            <label className="label-text">Keyword</label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-canopy-400" />
              <input
                className="input-field pl-9"
                placeholder="Tractor, harvester…"
                value={filters.search}
                onChange={updateFilter('search')}
              />
            </div>
          </div>
          <div>
  <label className="label-text">Equipment category</label>
  <select
    className="input-field"
    value={filters.categoryMain}
    onChange={(e) =>
      setFilters((prev) => ({
        ...prev,
        categoryMain: e.target.value,
        categorySub: '',
      }))
    }
  >
    <option value="">All equipment</option>
    <option value="heavy">Heavy Equipment</option>
    <option value="household">Household Equipment</option>
  </select>
</div>
    <div>
  <label className="label-text">Subcategory</label>
  <select
    className="input-field"
    value={filters.categorySub}
    onChange={(e) =>
      setFilters((prev) => ({
        ...prev,
        categorySub: e.target.value,
      }))
    }
  >
    <option value="">All subcategories</option>

    {filters.categoryMain === 'heavy' && (
      <>
        <option value="construction">Construction</option>
        <option value="agriculture">Agriculture</option>
        <option value="industrial">Industrial</option>
        <option value="transportation">Transportation</option>
        <option value="other">Other</option>
      </>
    )}

    {filters.categoryMain === 'household' && (
      <>
        <option value="cleaning">Cleaning</option>
        <option value="appliances">Appliances</option>
        <option value="gardening">Gardening</option>
        <option value="tools">Tools</option>
        <option value="entertainment">Entertainment</option>
        <option value="other">Other</option>
      </>
    )}
  </select>
</div> 
          <div>
            <label className="label-text">Machine type</label>
            <input
              className="input-field"
              placeholder="e.g. Tractor"
              value={filters.machineType}
              onChange={updateFilter('machineType')}
            />
          </div>
          <div>
            <label className="label-text">Village</label>
            <input
              className="input-field"
              placeholder="Village"
              value={filters.village}
              onChange={updateFilter('village')}
            />
          </div>
          <div>
            <label className="label-text">District</label>
            <input
              className="input-field"
              placeholder="District"
              value={filters.district}
              onChange={updateFilter('district')}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label-text">Min price</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={filters.minPrice}
                onChange={updateFilter('minPrice')}
              />
            </div>
            <div>
              <label className="label-text">Max price</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={filters.maxPrice}
                onChange={updateFilter('maxPrice')}
              />
            </div>
          </div>
          <div>
            <label className="label-text">Minimum rating</label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.5}
              className="input-field"
              placeholder="e.g. 4"
              value={filters.minRating}
              onChange={updateFilter('minRating')}
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Apply filters
          </button>
        </form>

        <div className="md:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-xl2 bg-canopy-100" />
              ))}
            </div>
          ) : machines.length === 0 ? (
            <EmptyState
              icon={<GiFarmTractor size={48} />}
              title="No equipment found"
              message="Try adjusting your filters or search a wider area."
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-canopy-500">{machines.length} equipments found</p>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {machines.map((m) => (
                  <MachineCard key={m._id} machine={m} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchResults;
