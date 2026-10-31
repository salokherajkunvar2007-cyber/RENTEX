import type { ReactNode } from 'react';

interface Props {
  icon?: ReactNode;
  title: string;
  message: string;
  action?: ReactNode;
}

const EmptyState = ({ icon, title, message, action }: Props) => (
  <div className="glass-card flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    {icon && <div className="text-canopy-300">{icon}</div>}
    <h3 className="font-display text-lg font-semibold text-canopy-800">{title}</h3>
    <p className="max-w-sm text-sm text-canopy-500">{message}</p>
    {action}
  </div>
);

export default EmptyState;
