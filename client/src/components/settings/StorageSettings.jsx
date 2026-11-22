import { useEffect, useState } from 'react';
import api from '../../api';

function Stepper({ label, value, onChange }) {
  return (
    <div className="stepper">
      <span className="label">{label}</span>
      <button type="button" onClick={() => onChange(-1)}>−</button>
      <strong>{value}</strong>
      <button type="button" onClick={() => onChange(1)}>+</button>
    </div>
  );
}

export default function StorageSettings() {
  const [offices, setOffices] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/offices').then((res) => setOffices(res.data));
  }, [refreshKey]);

  async function run(action) {
    setError('');
    try {
      await action();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  }

  const change = (o, field, delta) => run(() => api.put(`/offices/${o._id}`, { [field]: o[field] + delta }));

  function rename(o) {
    const newName = window.prompt('New office name', o.name);
    if (newName && newName.trim() !== o.name) run(() => api.put(`/offices/${o._id}`, { name: newName }));
  }

  function add(e) {
    e.preventDefault();
    run(async () => {
      await api.post('/offices', { name });
      setName('');
    });
  }

  return (
    <>
      {error && <p className="error">{error}</p>}

      {offices.map((o) => (
        <section key={o._id} className="card office">
          <div className="row-between">
            <h2>{o.name} <span className="hint">· {o.cupboards * o.rowsPerCupboard} places in all</span></h2>
            <button className="btn-small" onClick={() => rename(o)}>Rename</button>
          </div>

          <div className="steppers">
            <Stepper label="Cupboards" value={o.cupboards} onChange={(d) => change(o, 'cupboards', d)} />
            <Stepper label="Rows in each" value={o.rowsPerCupboard} onChange={(d) => change(o, 'rowsPerCupboard', d)} />
          </div>

          <div className="cupboards">
            {Array.from({ length: o.cupboards }, (_, i) => (
              <div key={i} className="cupboard">
                <strong>Cupboard {i + 1}</strong>
                {Array.from({ length: o.rowsPerCupboard }, (_, r) => <span key={r} className="shelf" />)}
              </div>
            ))}
          </div>
        </section>
      ))}

      <form className="card" onSubmit={add}>
        <h2>Add another office</h2>
        <div className="add-row">
          <input className="input" placeholder="Office name" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn-small" disabled={!name.trim()}>Add office</button>
        </div>
      </form>
    </>
  );
}