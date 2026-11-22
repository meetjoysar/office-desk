import { useEffect, useState } from 'react';
import api from '../../api';

export default function TypeSettings({ kind }) {
  const [types, setTypes] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/types', { params: { kind, all: 1 } }).then((res) => setTypes(res.data));
  }, [kind, refreshKey]);

  async function run(action) {
    setError('');
    try {
      await action();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  }

  function add(e) {
    e.preventDefault();
    run(async () => {
      await api.post('/types', { kind, name });
      setName('');
    });
  }

  function rename(t) {
    const newName = window.prompt('New name', t.name);
    if (newName && newName.trim() !== t.name) run(() => api.patch(`/types/${t._id}`, { name: newName }));
  }

  const toggle = (t) => run(() => api.patch(`/types/${t._id}`, { isActive: !t.isActive }));

  return (
    <section className="card narrow">
      <h2>{kind === 'DOC' ? 'Document list' : 'Work types'}</h2>
      <p className="hint">Staff tap from this list. Hidden items still show on old records.</p>

      <ul className="list">
        {types.map((t) => (
          <li key={t._id} className={`list-row ${t.isActive ? '' : 'muted'}`}>
            <span className="grow">{t.name}{!t.isActive && ' (hidden)'}</span>
            {t.isOther ? (
              <span className="hint">Always last</span>
            ) : (
              <>
                <button className="btn-small" onClick={() => rename(t)}>Rename</button>
                <button className="btn-small" onClick={() => toggle(t)}>{t.isActive ? 'Hide' : 'Show'}</button>
              </>
            )}
          </li>
        ))}
      </ul>

      <form className="add-row" onSubmit={add} style={{ marginTop: 16 }}>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={kind === 'DOC' ? 'New document name' : 'New work type'} />
        <button className="btn-small" disabled={!name.trim()}>Add</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}