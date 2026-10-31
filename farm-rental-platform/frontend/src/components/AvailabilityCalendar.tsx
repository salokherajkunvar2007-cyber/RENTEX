import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import type { AvailabilitySlot } from '../types';

type ValuePiece = Date | null;
type CalendarValue = ValuePiece | [ValuePiece, ValuePiece];

interface Props {
  availability: AvailabilitySlot[];
  value: CalendarValue;
  onChange: (value: CalendarValue) => void;
  selectRange?: boolean;
}

const isSameOrBetween = (date: Date, start: Date, end: Date) => {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const s = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const e = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  return d >= s && d <= e;
};

const AvailabilityCalendar = ({ availability, value, onChange, selectRange = true }: Props) => {
  const isBooked = (date: Date) =>
    availability.some((slot) =>
      isSameOrBetween(date, new Date(slot.startDate), new Date(slot.endDate))
    );

  return (
    <div className="rc-shell">
      <Calendar
        onChange={(val) => onChange(val as CalendarValue)}
        value={value}
        selectRange={selectRange}
        minDate={new Date()}
        tileDisabled={({ date }) => isBooked(date)}
        tileClassName={({ date }) => (isBooked(date) ? 'booked-tile' : undefined)}
      />
      <div className="mt-3 flex items-center gap-4 text-xs text-canopy-600">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-[#fbdada]" /> Booked
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full bg-canopy-700" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-full border border-canopy-300 bg-white" /> Available
        </span>
      </div>
    </div>
  );
};

export default AvailabilityCalendar;
