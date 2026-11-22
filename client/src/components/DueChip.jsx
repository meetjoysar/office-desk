import { dueInfo, fmtDay } from '../utils';

export default function DueChip({ task }) {
  const { label, tone } = dueInfo(task);
  return (
    <div className="due">
      <span className={`pill ${tone}`}>{label}</span>
      <small className="hint">Due {fmtDay(task.dueDate)}</small>
    </div>
  );
}