import { Link } from 'react-router-dom';
import { GiFarmTractor } from 'react-icons/gi';
import { FiMail, FiPhone } from 'react-icons/fi';

const Footer = () => (
  <footer className="mt-20 border-t border-canopy-100 bg-canopy-900 text-canopy-100">
    <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
      <div>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-harvest-500 text-canopy-900">
            <GiFarmTractor size={20} />
          </span>
          <span className="font-display text-xl font-semibold text-white">rentex</span>
        </div>
        <p className="mt-3 max-w-xs text-sm text-canopy-300">
          Connecting users with nearby machine owners — rent tractors, harvesters and equipment
          by the hour, day, or acre.
        </p>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-harvest-300">
          Quick links
        </h4>
        <ul className="space-y-2 text-sm text-canopy-300">
          <li>
            <Link to="/search" className="hover:text-white">
              Find Machines
            </Link>
          </li>
          <li>
            <Link to="/register" className="hover:text-white">
              List Your Machine
            </Link>
          </li>
          <li>
            <Link to="/login" className="hover:text-white">
              Log In
            </Link>
          </li>
        </ul>
      </div>

      <div>
        <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-harvest-300">
          Get in touch
        </h4>
        <ul className="space-y-2 text-sm text-canopy-300">
          <li className="flex items-center gap-2">
            <FiMail size={14} /> support@Rentex.example
          </li>
          <li className="flex items-center gap-2">
            <FiPhone size={14} /> 1800-000-0000
          </li>
        </ul>
      </div>
    </div>
    <div className="border-t border-canopy-800 py-4 text-center text-xs text-canopy-400">
      © {new Date().getFullYear()} RENTEX. Making equipment rental simple, accessible, and reliable.
    </div>
  </footer>
);

export default Footer;
