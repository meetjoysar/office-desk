import { useEffect, useState } from 'react';
import api from '../../api';
import { useAuth } from '../../useAuth';
import { initials } from '../../utils';

const EMPTY = { fullName: '', shortName: '', role: 'STAFF', email: '', mobile: '' };

export default function StaffSettings() {
  const { user: me } = useAuth();
  const [people, setPeople] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [newPin, setNewPin] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tasks, setTasks] = useState([]);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    api.get('/users').then((res) => setPeople(res.data));
    api.get('/tasks').then((res) => setTasks(res.data));
  }, [refreshKey]);

  const selected = people.find((p) => p._id === selectedId);
  const openCount = (id) =>
    tasks.filter((t) => t.status !== 'DONE' && t.assignedTo?._id === id).length;
  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }));

  async function run(action) {
    setError('');
    setMessage('');
    setNewPin(null);
    try {
      await action();
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  }

  function save(e) {
    e.preventDefault();
    run(async () => {
      if (form._id) {
        await api.put(`/users/${form._id}`, form);
        setMessage('Details saved');
      } else {
        const res = await api.post('/users', form);
        setNewPin({ name: res.data.user.shortName, pin: res.data.pin });
      }
      setForm(EMPTY);
    });
  }

  function resetPin(p) {
    if (!window.confirm(`Make a new PIN for ${p.shortName}?`)) return;
    run(async () => {
      const res = await api.post(`/users/${p._id}/reset-pin`);
      setNewPin({ name: p.shortName, pin: res.data.pin });
    });
  }

  function toggleActive(p) {
    if (p.isActive && openCount(p._id) > 0) return setLeaving(true); // choose who takes the tasks first
    const msg = p.isActive
      ? `${p.shortName} has left the office? They will not be able to log in.`
      : `Bring ${p.shortName} back?`;
    if (window.confirm(msg))
      run(() => api.patch(`/users/${p._id}/active`, { isActive: !p.isActive }));
  }

  function handOver(p, toId) {
    if (!window.confirm(`Move ${p.shortName}'s open tasks and remove access?`)) return;
    setLeaving(false);
    run(() => api.patch(`/users/${p._id}/active`, { isActive: false, moveTasksTo: toId }));
  }

  function startEdit(p) {
    setForm({
      _id: p._id,
      fullName: p.fullName,
      shortName: p.shortName,
      role: p.role,
      email: p.email || '',
      mobile: p.mobile || '',
    });
  }

  return (
    <>
      {error && <p className="error">{error}</p>}
      <div className="two-col">
        <section className="card">
          <h2>People · tap one to manage</h2>
          {newPin && (
            <div className="pin-box">
              New PIN for {newPin.name}: <strong>{newPin.pin}</strong>
              <br />
              <small>Shown only once. Write it down and give it to them.</small>
            </div>
          )}
          <div className="tiles four">
            {people.map((p) => (
              <button
                key={p._id}
                className={`tile ${selectedId === p._id ? 'selected' : ''} ${p.isActive ? '' : 'muted'}`}
                onClick={() => {
                  setSelectedId(p._id);
                  setLeaving(false);
                }}
              >
                <span className="avatar">{initials(p.fullName)}</span>
                <strong>{p.shortName}</strong>
                <small>{!p.isActive ? 'Has left' : p.role === 'BOSS' ? 'Boss' : 'Staff'}</small>
                <small>{openCount(p._id)} open tasks</small>
              </button>
            ))}
          </div>
          {selected && (
            <div className="panel">
              <p>
                <strong>{selected.fullName}</strong> · {selected.role === 'BOSS' ? 'Boss' : 'Staff'}
                {selected.email && ` · ${selected.email}`}
              </p>
              <div className="chips">
                <button className="btn-small" onClick={() => resetPin(selected)}>
                  Reset PIN
                </button>
                <button className="btn-small" onClick={() => startEdit(selected)}>
                  Edit details
                </button>
                {selected._id !== me._id && (
                  <button className="btn-small danger" onClick={() => toggleActive(selected)}>
                    {selected.isActive ? 'Has left the office' : 'Bring back'}
                  </button>
                )}
              </div>
              {leaving && selected.isActive && (
                <div className="reveal">
                  <p>
                    <strong>{selected.shortName}</strong> has {openCount(selected._id)} open tasks.
                    Give them to:
                  </p>
                  <div className="chips">
                    {people
                      .filter((p) => p.isActive && p._id !== selected._id)
                      .map((p) => (
                        <button
                          key={p._id}
                          className="chip"
                          onClick={() => handOver(selected, p._id)}
                        >
                          {p.shortName}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <form className="card" onSubmit={save}>
          <h2>{form._id ? 'Edit person' : 'Add a person'}</h2>
          <label>
            Full name *
            <input
              className="input"
              value={form.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
            />
          </label>
          <label>
            Name on login tile
            <input
              className="input"
              value={form.shortName}
              placeholder={form.fullName.trim().split(' ')[0] || 'e.g. Ramesh'}
              onChange={(e) => setField('shortName', e.target.value)}
            />
          </label>
          <p className="label">Role</p>
          <div className="chips">
            {[
              ['STAFF', 'Staff'],
              ['BOSS', 'Boss'],
            ].map(([v, l]) => (
              <button
                type="button"
                key={v}
                className={`chip ${form.role === v ? 'selected' : ''}`}
                onClick={() => setField('role', v)}
              >
                {l}
              </button>
            ))}
          </div>
          <label>
            Email (for task reminders)
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => setField('email', e.target.value)}
            />
          </label>
          <label>
            Mobile
            <input
              className="input"
              value={form.mobile}
              onChange={(e) => setField('mobile', e.target.value)}
            />
          </label>
          {message && <p className="success">{message}</p>}
          <button className="btn-primary">{form._id ? 'Save changes' : 'Save person'}</button>
          {form._id ? (
            <button type="button" className="btn-secondary" onClick={() => setForm(EMPTY)}>
              Cancel
            </button>
          ) : (
            <p className="hint">A 4-digit PIN is made automatically and shown once after saving.</p>
          )}
        </form>
      </div>
    </>
  );
}