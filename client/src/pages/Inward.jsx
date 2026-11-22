import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../useAuth';
import ClientPicker from '../components/ClientPicker';
import Segmented from '../components/Segmented';
import { fmtDateTime, placeText } from '../utils';

const COPY = [['HARD', 'Hard copy'], ['SOFT', 'Soft copy']];
const ORIG = [['ORIGINAL', 'Original'], ['XEROX', 'Xerox']];
let lineKey = 0; // gives each document line a unique key

// Changing the key throws away the old form and starts a fresh one
export default function InwardPage() {
  const [formKey, setFormKey] = useState(0);
  return <InwardForm key={formKey} onAnother={() => setFormKey((k) => k + 1)} />;
}

function NumberTiles({ count, value, onChange }) {
  return (
    <div className="num-tiles">
      {Array.from({ length: count }, (_, i) => i + 1).map((n) => (
        <button type="button" key={n} className={`num ${value === n ? 'selected' : ''}`} onClick={() => onChange(n)}>
          {n}
        </button>
      ))}
    </div>
  );
}

function InwardForm({ onAnother }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [openedAt] = useState(() => new Date());
  const [docTypes, setDocTypes] = useState([]);
  const [offices, setOffices] = useState([]);
  const [client, setClient] = useState(null);
  const [info, setInfo] = useState(null); // last place + third-party names
  const [lines, setLines] = useState([]);
  const [source, setSource] = useState('DIRECT');
  const [thirdPartyName, setThirdPartyName] = useState('');
  const [place, setPlace] = useState({ office: null, cupboard: null, row: null });
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(null);

  useEffect(() => {
    api.get('/types', { params: { kind: 'DOC' } }).then((res) => setDocTypes(res.data));
    api.get('/offices').then((res) => setOffices(res.data));
  }, []);

  useEffect(() => {
    if (!client) return;
    api.get('/inwards/client-info', { params: { client: client._id } }).then((res) => setInfo(res.data));
  }, [client]);

  function pickClient(c) {
    setClient(c);
    setInfo(null);
  }

  function toggleType(t) {
    const line = { key: ++lineKey, typeId: t._id, name: t.name, isOther: t.isOther,
      otherText: '', copyKind: 'HARD', originalKind: 'XEROX' };
    if (t.isOther) return setLines((ls) => [...ls, line]); // "Other" can be added many times
    setLines((ls) => (ls.some((l) => l.typeId === t._id) ? ls.filter((l) => l.typeId !== t._id) : [...ls, line]));
  }

  const updateLine = (key, field, value) =>
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, [field]: value } : l)));
  const removeLine = (key) => setLines((ls) => ls.filter((l) => l.key !== key));

  const office = offices.find((o) => o._id === place.office);
  const lastPlace = info?.lastPlace && offices.some((o) => o._id === info.lastPlace.office) ? info.lastPlace : null;

  async function save() {
    setError('');
    try {
      const res = await api.post('/inwards', {
        client: client?._id, source, thirdPartyName, note, place,
        items: lines.map((l) => ({
          docType: l.typeId, otherText: l.otherText, copyKind: l.copyKind, originalKind: l.originalKind,
        })),
      });
      setSaved(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  }

  if (saved) {
    return (
      <div className="card success-screen">
        <p className="hint">Inward saved</p>
        <div className="big-number">{saved.number}</div>
        <p>{saved.items.length} documents from <strong>{client.name}</strong><br />Kept in {placeText(saved.place)}</p>
        <div className="btn-row">
          <button className="btn-primary" onClick={onAnother}>Make another Inward</button>
          <button className="btn-secondary" onClick={() => navigate('/')}>Back to My Work</button>
        </div>
      </div>
    );
  }

  return (
    <div className="form-page">
      <h1>Document received</h1>

      <section className="card">
        <h2>1. Which client?</h2>
        <ClientPicker value={client} onChange={pickClient} />
      </section>

      <section className="card">
        <div className="row-between">
          <h2>2. Which documents? (tap all that came)</h2>
          <span className="hint">{lines.length} selected</span>
        </div>
        <div className="type-grid">
          {docTypes.map((t) => {
            const on = !t.isOther && lines.some((l) => l.typeId === t._id);
            return (
              <button type="button" key={t._id} className={`toggle ${on ? 'selected' : ''}`} onClick={() => toggleType(t)}>
                {!t.isOther && <span className="box" />}
                {t.isOther ? '+ Other…' : t.name}
              </button>
            );
          })}
        </div>
      </section>

      {lines.length > 0 && (
        <section className="card">
          <h2>3. What kind of copy?</h2>
          {lines.map((l) => (
            <div key={l.key} className="copy-row">
              {l.isOther ? (
                <input className="input other" placeholder="What is the other document?" value={l.otherText}
                  onChange={(e) => updateLine(l.key, 'otherText', e.target.value)} />
              ) : (
                <strong className="grow">{l.name}</strong>
              )}
              <Segmented options={COPY} value={l.copyKind} onChange={(v) => updateLine(l.key, 'copyKind', v)} />
              <Segmented options={ORIG} value={l.originalKind} onChange={(v) => updateLine(l.key, 'originalKind', v)} />
              <button type="button" className="btn-small" onClick={() => removeLine(l.key)} aria-label="Remove">✕</button>
            </div>
          ))}
        </section>
      )}

      <section className="card">
        <h2>4. Who gave it to you?</h2>
        <div className="cards2">
          <button type="button" className={`big-choice ${source === 'DIRECT' ? 'selected' : ''}`} onClick={() => setSource('DIRECT')}>
            <strong>Directly from client</strong><span className="hint">Client gave it to me</span>
          </button>
          <button type="button" className={`big-choice ${source === 'THIRD_PARTY' ? 'selected' : ''}`} onClick={() => setSource('THIRD_PARTY')}>
            <strong>Through someone else</strong><span className="hint">Accountant, staff, courier…</span>
          </button>
        </div>
        {source === 'THIRD_PARTY' && (
          <div className="reveal">
            <label>Name of the person
              <input className="input" value={thirdPartyName} onChange={(e) => setThirdPartyName(e.target.value)} />
            </label>
            <div className="chips">
              {info?.thirdPartyNames.map((n) => (
                <button type="button" key={n} className={`chip ${thirdPartyName === n ? 'selected' : ''}`}
                  onClick={() => setThirdPartyName(n)}>{n}</button>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="card">
        <h2>5. Where will you keep it?</h2>
        {lastPlace && (
          <button type="button" className="same-place"
            onClick={() => setPlace({ office: lastPlace.office, cupboard: lastPlace.cupboard, row: lastPlace.row })}>
            Same place as last time for this client: {placeText(lastPlace)}
          </button>
        )}

        <p className="label">Office</p>
        <div className="chips">
          {offices.map((o) => (
            <button type="button" key={o._id} className={`chip ${place.office === o._id ? 'selected' : ''}`}
              onClick={() => setPlace({ office: o._id, cupboard: null, row: null })}>{o.name}</button>
          ))}
        </div>

        {office && (
          <>
            <p className="label">Cupboard in {office.name}</p>
            <NumberTiles count={office.cupboards} value={place.cupboard}
              onChange={(n) => setPlace((p) => ({ ...p, cupboard: n, row: null }))} />
          </>
        )}
        {office && place.cupboard && (
          <>
            <p className="label">Row in Cupboard {place.cupboard}</p>
            <NumberTiles count={office.rowsPerCupboard} value={place.row}
              onChange={(n) => setPlace((p) => ({ ...p, row: n }))} />
          </>
        )}
        {office && place.cupboard && place.row && (
          <span className="note-tag">Kept in: {placeText({ officeName: office.name, ...place })}</span>
        )}
      </section>

      <div className="info-line">
        Saved automatically: received by <strong>{user.shortName}</strong> on {fmtDateTime(openedAt)}
      </div>

      <label>Note (optional)
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {error && <p className="error">{error}</p>}
      <div className="btn-row">
        <button className="btn-primary" onClick={save}>Save Inward ({lines.length} documents)</button>
        <button className="btn-secondary" onClick={() => navigate('/')}>Cancel</button>
      </div>
    </div>
  );
}