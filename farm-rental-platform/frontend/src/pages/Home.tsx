import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiMapPin, FiCalendar, FiShield } from 'react-icons/fi';
import { getMachinesApi } from '../api/endpoints';
import type { Machine } from '../types';
import MachineCard from '../components/MachineCard';


const Home = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [featured, setFeatured] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getMachinesApi({ limit: 6 });
        setFeatured(data.machines);
      } catch {
        // non-critical
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(query ? `/search?search=${encodeURIComponent(query)}` : '/search');
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-field-gradient text-cream">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="max-w-2xl">
            <span className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide">
               Equipment, shared when you need it            
            </span>
            <h1 className="mt-5 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              Rent the right Equipment, whenever you need it.
            </h1>
            <p className="mt-4 max-w-xl text-canopy-100">
         RENTEX connects equipment owners with people who need them — discover equipment nearby, check availability, and book in minutes.           
            </p>

            <form
              onSubmit={handleSearch}
              className="mt-8 flex flex-col gap-3 rounded-xl2 bg-white p-2 shadow-glass sm:flex-row"
            >
              <div className="flex flex-1 items-center gap-2 px-3">
                <FiSearch className="text-canopy-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search equipment, brand, location…"
                  className="w-full border-none py-2.5 text-sm text-canopy-900 outline-none placeholder:text-canopy-400"
                />
              </div>
              <button type="submit" className="btn-accent">
                Search
              </button>
            </form>

            <div className="mt-8 flex flex-wrap gap-6 text-sm text-canopy-100">
              <span className="flex items-center gap-2">
                <FiMapPin /> Search by village & district
              </span>
              <span className="flex items-center gap-2">
                <FiCalendar /> Live availability calendar
              </span>
              <span className="flex items-center gap-2">
                <FiShield /> No double bookings
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Machine type shortcuts */}
      <section className="mx-auto -mt-10 max-w-7xl px-4 sm:px-6 lg:px-8">
  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

    <button
      onClick={() => navigate('/search?categoryMain=heavy')}
      className="glass-card group p-8 text-left transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-4 text-5xl">🏗️</div>

          <h2 className="font-display text-2xl font-semibold text-canopy-900">
            Heavy Equipment
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-canopy-500">
            Construction, agriculture, industrial and other heavy equipment
            available for rental.
          </p>
        </div>

        <span className="text-2xl text-canopy-400 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </button>

    <button
      onClick={() => navigate('/search?categoryMain=household')}
      className="glass-card group p-8 text-left transition-all hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="mb-4 text-5xl">🏠</div>

          <h2 className="font-display text-2xl font-semibold text-canopy-900">
            Household Equipment
          </h2>

          <p className="mt-2 text-sm leading-relaxed text-canopy-500">
            Cleaning machines, appliances, tools, gardening equipment and more
            for your everyday needs.
          </p>
        </div>

        <span className="text-2xl text-canopy-400 transition-transform group-hover:translate-x-1">
          →
        </span>
      </div>
    </button>

  </div>
</section>

      {/* Featured machines */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-2xl font-semibold text-canopy-900">
              Recently listed
            </h2>
            <p className="mt-1 text-sm text-canopy-500">Fresh listings from owners near you</p>
          </div>
          <Link to="/search" className="text-sm font-semibold text-canopy-700 underline">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-72 animate-pulse rounded-xl2 bg-canopy-100" />
            ))}
          </div>
        ) : featured.length === 0 ? (
          <p className="text-canopy-500">
            No equipment listed yet. Be the first owner to add one!
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((m) => (
              <MachineCard key={m._id} machine={m} />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="glass-card flex flex-col items-center gap-4 bg-canopy-700 p-10 text-center text-cream sm:flex-row sm:justify-between sm:text-left">
          <div>
          <h3 className="font-display text-2xl font-semibold">
  Own equipment you want to rent out?
</h3>
<p className="mt-1 text-canopy-100">
  List your equipment on RENTEX and earn when it is not in use.
</p>
          </div>
          <Link to="/register" className="btn-accent whitespace-nowrap">
            List your equipment
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
