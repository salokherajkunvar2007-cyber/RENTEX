interface Props {
  status: string;
}

const labelMap: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
  healthy: 'Healthy',
  'due-soon': 'Due soon',
  overdue: 'Overdue',
};

const classMap: Record<string, string> = {
  pending: 'badge-pending',
  approved: 'badge-approved',
  rejected: 'badge-rejected',
  cancelled: 'badge-cancelled',
  completed: 'badge-completed',
  healthy: 'badge-approved',
  'due-soon': 'badge-pending',
  overdue: 'badge-rejected',
};

const StatusBadge = ({ status }: Props) => (
  <span className={`badge ${classMap[status] || 'badge-cancelled'}`}>
    {labelMap[status] || status}
  </span>
);

export default StatusBadge;
