export default function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(([v, label]) => (
        <button type="button" key={v} className={value === v ? 'selected' : ''} onClick={() => onChange(v)}>
          {label}
        </button>
      ))}
    </div>
  );
}