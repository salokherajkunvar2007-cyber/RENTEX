import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { GiFarmTractor } from 'react-icons/gi';

const Splash = () => {
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 1400);
    return () => clearTimeout(timer);
  }, []);

  if (done) return <Navigate to="/home" replace />;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-field-gradient text-cream">
      <div className="animate-bounce">
        <GiFarmTractor size={64} />
      </div>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight">Rentex</h1>
      <p className="mt-2 text-canopy-100">Farm machinery, right down the road.</p>
    </div>
  );
};

export default Splash;
