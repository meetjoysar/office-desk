import { useEffect, useState } from 'react';
import api from '../api';

export default function ClientPicker({ value, onChange }) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (search.trim().length < 2) return;
    const t = setTimeout(() => {
      api.get('/clients', { params: { search } }).then((res) => setResults(res.data.slice(0, 8)));
    }, 250);
    return () => clearTimeout(t);
  }, [search]);

  if (value) {
    return (
      <div className="picked">
        <strong>{value.name}</strong>
        <button type="button" className="btn-small" onClick={() => { onChange(null); setSearch(''); }}>
          Change
        </button>
      </div>
    );
  }

  return (
    <>
      <input className="input" placeholder="Type 2 letters of the client name" autoFocus
        value={search} onChange={(e) => setSearch(e.target.value)} />
      {search.trim().length >= 2 && (
        <div className="chips">
          {results.map((c) => (
            <button type="button" key={c._id} className="chip" onClick={() => onChange(c)}>{c.name}</button>
          ))}
          {results.length === 0 && <span className="hint">No client found</span>}
        </div>
      )}
    </>
  );
}