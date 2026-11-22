import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../useAuth';
import ClientPicker from '../components/ClientPicker';
import { fmtDateTime, placeText } from '../utils';

export default function OutwardPage() {
  const [formKey, setFormKey] = useState(0);
  return <OutwardForm key={formKey} onAnother={() => setFormKey((k) => k + 1)} />;
}

const withUs = (inward) => inward.items.filter((i) => !i.returnedIn);

function OutwardForm({ onAnother }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openedAt] = useState(() => new Date());
  const [client, setClient] = useState(null);
  const [groups, setGroups] = useState([]); // Inward entries with documents still with us
  const [ticked, setTicked] = useState([]); // item ids
  const [givenTo, setGivenTo] = useState('CLIENT');
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    if (!client) return;
    api.get('/inwards/with-us', { params: { client: client._id } }).then((res) => setGroups(res.data));
  }, [client]);

  function pickClient(c) {
    setClient(c);
    setGroups([]);
    setTicked([]);
  }

  const allIds = groups.flatMap((g) => withUs(g).map((i) => i._id));
  const toggle = (id) => setTicked((t) => (t.includes(id) ? t.filter((x) => x !== id) : [...t, id]));

  async function save() {
    setError('');
    try {
      const items = groups.flatMap((g) =>
        withUs(g).filter((i) => ticked.includes(i._id)).map((i) => ({ inward: g._id, itemId: i._id }))
      );
      const res = await api.post('/outwards', { client: client?._id, givenTo, thirdPartyName, items, note });
      setSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  }

  if (saved) {
    return (
      <div className="card success-screen">
        <p className="hint">Outward saved</p>
        <div className="big-number">{saved.number}</div>
        <p>{saved.items.length} documents given back to <strong>{saved.givenTo === 'CLIENT' ? client.name : saved.thirdPartyName}</strong></p>
        <div className="btn-row">
          <button className="btn-primary" onClick={onAnother}>Make another Outward</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>Back to My Work</button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h1>Document returned</h1>

      <section className="card">
        <h2>1. Which client?</h2>
        <ClientPicker value={client} onChange={pickClient} />
        {client && (
          <p className="hint">{allIds.length ? `${allIds.length} documents with us` : 'Nothing with us for this client'}</p>
        )}
      </section>

      {allIds.length > 0 && (
        <section className="card">
          <div className="row-between">
            <h2>2. Tick what you are giving back</h2>
            <button type="button" className="btn-small"
              onClick={() => setTicked(ticked.length === allIds.length ? [] : allIds)}>
              {ticked.length === allIds.length ? 'Clear all' : 'Select all'}
            </button>
          </div>

          {groups.map((g) => (
            <div key={g._id} className="group">
              <div className="group-head">
                <span className="note-tag">{placeText(g.place)}</span>
                <span className="hint">
                  {g.number} · {fmtDateTime(g.receivedAt)} ·{' '}
                  {g.source === 'DIRECT' ? 'from client directly' : `through ${g.thirdPartyName}`} ·
                  received by {g.receivedBy.shortName}
                </span>
              </div>
              {withUs(g).map((i) => (
                <button type="button" key={i._id} className={`toggle doc-row ${ticked.includes(i._id) ? 'selected' : ''}`}
                  onClick={() => toggle(i._id)}>
                  <span className="box" />
                  <span className="grow">{i.docName}</span>
                  <span className="tag">{i.copyKind === 'HARD' ? 'Hard copy' : 'Soft copy'}</span>
                  <span className={`tag ${i.originalKind === 'ORIGINAL' ? 'dark' : ''}`}>
                    {i.originalKind === 'ORIGINAL' ? 'Original' : 'Xerox'}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2>3. Given to whom?</h2>
        <div className="cards2">
          <button type="button" className={`big-choice ${givenTo === 'CLIENT' ? 'selected' : ''}`} onClick={() => setGivenTo('CLIENT')}>
            <strong>Client directly</strong><span className="hint">Handed to the client</span>
          </button>
          <button type="button" className={`big-choice ${givenTo === 'THIRD_PARTY' ? 'selected' : ''}`} onClick={() => setGivenTo('THIRD_PARTY')}>
            <strong>Someone else</strong><span className="hint">Accountant, staff, courier…</span>
          </button>
        </div>
        {givenTo === 'THIRD_PARTY' && (
          <div className="reveal">
            <label>Name of the person
              <input className="input" value={thirdPartyName} onChange={(e) => setThirdPartyName(e.target.value)} />
            </label>
          </div>
        )}
      </section>

      <div className="info-line">
        Saved automatically: given by <strong>{user.shortName}</strong> on {fmtDateTime(openedAt)}
      </div>

      <label>Note (optional)
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {error && <p className="error">{error}</p>}
      <div className="btn-row">
        <button className="btn-primary" onClick={save}>Save Outward ({ticked.length} documents)</button>
        <button className="btn-secondary" onClick={() => navigate('/')}>Cancel</button>
      </div>
    </div>
  );
}