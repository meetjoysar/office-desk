import { useEffect, useState } from 'react';
import api from '../api';
import { initials } from '../utils';

const TYPES = [
  ['INDIVIDUAL', 'Individual'], ['FIRM', 'Firm'], ['COMPANY', 'Company'],
  ['HUF', 'HUF'], ['TRUST', 'Trust'],
];
const typeLabel = (v) => TYPES.find((t) => t[0] === v)?.[1];
const EMPTY = { name: '', clientType: 'INDIVIDUAL', mobile: '', email: '', usualStaff: null };

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('active');
  const [refreshKey, setRefreshKey] = useState(0); // bump it to reload the list
  const [people, setPeople] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [dupes, setDupes] = useState([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Load the list (waits 250ms after typing stops)
  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/clients', { params: { search, status } }).then((res) => setClients(res.data));
    }, 250);
    return () => clearTimeout(t);
  }, [search, status, refreshKey]);

  // People for "Usually handled by"
  useEffect(() => {
    api.get('/auth/users').then((res) => setPeople(res.data));
  }, []);

  // Duplicate warning while typing a NEW client's name (3+ letters)
  useEffect(() => {
    const name = form.name.trim();
    if (form._id || name.length < 3) return;
    const t = setTimeout(() => {
      api.get('/clients', { params: { search: name } }).then((res) => setDupes(res.data));
    }, 300);
    return () => clearTimeout(t);
  }, [form.name, form._id]);

  const showDupes = !form._id && form.name.trim().length >= 3 && dupes.length > 0;

  function setField(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function startEdit(c) {
    setForm({
      _id: c._id, name: c.name, clientType: c.clientType,
      mobile: c.mobile || '', email: c.email || '', usualStaff: c.usualStaff?._id || null,
    });
    setError('');
    setMessage('');
  }

  async function save(e) {
    e.preventDefault(); // stop the browser reloading the page
    setError('');
    setMessage('');
    try {
      if (form._id) await api.put(`/clients/${form._id}`, form);
      else await api.post('/clients', form);
      setMessage(form._id ? 'Client updated' : 'Client added');
      setForm(EMPTY);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  }

  async function toggleHidden(c) {
    await api.patch(`/clients/${c._id}/active`, { isActive: !c.isActive });
    setRefreshKey((k) => k + 1);
  }

  return (
    <div className="two-col">
      {/* LEFT: list */}
      <section className="card">
        <h2>{status === 'active' ? 'All clients' : 'Hidden clients'} · {clients.length}</h2>
        <input className="input" placeholder="Search clients" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <div className="chips">
          {['active', 'hidden'].map((s) => (
            <button key={s} className={`chip ${status === s ? 'selected' : ''}`} onClick={() => setStatus(s)}>
              {s === 'active' ? 'Active' : 'Hidden'}
            </button>
          ))}
        </div>

        <ul className="list">
          {clients.map((c) => (
            <li key={c._id} className="list-row">
              <span className="avatar square">{initials(c.name)}</span>
              <div className="grow">
                <strong>{c.name}</strong>
                <div className="hint">
                  {typeLabel(c.clientType)}
                  {c.mobile && ` · ${c.mobile}`}
                  {c.usualStaff && ` · usually ${c.usualStaff.shortName}`}
                </div>
              </div>
              <button className="btn-small" onClick={() => startEdit(c)}>Edit</button>
              <button className="btn-small" onClick={() => toggleHidden(c)}>
                {c.isActive ? 'Hide' : 'Show'}
              </button>
            </li>
          ))}
          {clients.length === 0 && <li className="hint">No clients found</li>}
        </ul>
      </section>

      {/* RIGHT: add / edit form */}
      <form className="card" onSubmit={save}>
        <h2>{form._id ? 'Edit client' : 'Add a client'}</h2>

        <label>Client name *
          <input className="input" value={form.name} onChange={(e) => setField('name', e.target.value)} />
        </label>
        {showDupes && (
          <p className="warn">
            Already in the list: {dupes.slice(0, 3).map((d) => d.name).join(', ')}. Is this the same client?
          </p>
        )}

        <p className="label">Type</p>
        <div className="chips">
          {TYPES.map(([v, l]) => (
            <button type="button" key={v} className={`chip ${form.clientType === v ? 'selected' : ''}`}
              onClick={() => setField('clientType', v)}>{l}</button>
          ))}
        </div>

        <label>Mobile
          <input className="input" placeholder="10 digits" value={form.mobile}
            onChange={(e) => setField('mobile', e.target.value)} />
        </label>

        <label>Email (optional)
          <input className="input" type="email" value={form.email}
            onChange={(e) => setField('email', e.target.value)} />
        </label>

        <p className="label">Usually handled by (optional)</p>
        <div className="chips">
          {people.map((u) => (
            <button type="button" key={u._id}
              className={`chip ${form.usualStaff === u._id ? 'selected' : ''}`}
              onClick={() => setField('usualStaff', form.usualStaff === u._id ? null : u._id)}>
              {u.shortName}
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
        {message && <p className="success">{message}</p>}

        <button className="btn-primary">{form._id ? 'Save changes' : 'Save client'}</button>
        {form._id && (
          <button type="button" className="btn-secondary" onClick={() => setForm(EMPTY)}>Cancel</button>
        )}
      </form>
    </div>
  );
}