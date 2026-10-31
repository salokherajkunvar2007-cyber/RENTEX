import { Link } from 'react-router-dom';
import { GiFarmTractor } from 'react-icons/gi';

const NotFound = () => (
  <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
    <GiFarmTractor size={56} className="text-canopy-300" />
    <h1 className="mt-6 font-display text-4xl font-semibold text-canopy-900">
      This field is empty
    </h1>
    <p className="mt-2 max-w-md text-canopy-500">
      The page you're looking for has been ploughed over or never existed.
    </p>
    <Link to="/" className="btn-primary mt-8">
      Back to home
    </Link>
  </div>
);

export default NotFound;
