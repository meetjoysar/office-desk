import { useEffect, useState } from 'react';
import api from '../api';
import { fmtDate, placeText } from '../utils';

const STATUS = [['with', 'With us'], ['returned', 'Returned'], ['all', 'All']];

export default function Documents() {
  const [status, setStatus] = useState('with');
  const [search, setSearch] = useState('');
  const [originalsOnly, setOriginalsOnly] = useState(false);
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const t = setTimeout(() => {
      api.get('/inwards/register', { params: { status, search } }).then((res) => setRows(res.data));
    }, 250);
    return () => clearTimeout(t);
  }, [status, search]);

  const shown = originalsOnly ? rows.filter((r) => r.originalKind === 'ORIGINAL') : rows;

  return (
    <>
      <h1>Documents</h1>
      <div className="card">
        <input className="input" placeholder="Search client or document" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <div className="chips">
          {STATUS.map(([v, l]) => (
            <button key={v} className={`chip ${status === v ? 'selected' : ''}`} onClick={() => setStatus(v)}>{l}</button>
          ))}
          <button className={`chip ${originalsOnly ? 'selected' : ''}`} onClick={() => setOriginalsOnly((o) => !o)}>
            Originals only
          </button>
        </div>

        <table className="table">
          <thead>
            <tr><th>Document</th><th>Client</th><th>Copy</th><th>Place</th><th>Received</th><th>Status</th></tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r._id}>
                <td><strong>{r.docName}</strong></td>
                <td>{r.clientName}</td>
                <td>
                  {r.copyKind === 'HARD' ? 'Hard' : 'Soft'} ·{' '}
                  {r.originalKind === 'ORIGINAL' ? <span className="tag dark">Original</span> : 'Xerox'}
                </td>
                <td>{placeText(r.place)}</td>
                <td>{fmtDate(r.receivedAt)}<div className="hint">{r.number} · by {r.receivedBy}</div></td>
                <td>
                  {r.outward ? (
                    <span className="hint">
                      Returned {fmtDate(r.returnedAt)} to {r.outward.givenTo === 'CLIENT' ? 'client' : r.outward.thirdPartyName}
                      <br />{r.outward.number}
                    </span>
                  ) : (
                    <span className="pill green">With us</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {shown.length === 0 && <p className="hint">No documents found</p>}
      </div>
    </>
  );
}