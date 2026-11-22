const OPTIONS = [
  ['TODO', '○', 'To Do'],
  ['IN_PROGRESS', '◐', 'In Progress'],
  ['DONE', '✓', 'Done'],
];

// Icon + word on every button, never colour alone
export default function StatusControl({ value, onChange }) {
  return (
    <div className="segmented status">
      {OPTIONS.map(([v, icon, label]) => (
        <button
          type="button"
          key={v}
          className={value === v ? `selected s-${v}` : ''}
          onClick={() => value !== v && onChange(v)}
        >
          <span aria-hidden="true">{icon}</span> {label}
        </button>
      ))}
    </div>
  );
}