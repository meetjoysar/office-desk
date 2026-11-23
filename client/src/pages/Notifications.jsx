import { useEffect, useState } from 'react';
import api from '../api';
import { fmtDateTime } from '../utils';

const KIND = {
  ASSIGNED: { label: 'New task', tone: 'grey' },
  DUE_REMINDER: { label: 'Reminder', tone: 'orange' },
  OVERDUE: { label: 'Overdue', tone: 'red' },
  OVERDUE_FOR_BOSS: { label: 'Overdue', tone: 'red' },
};

export default function Notifications() {
  const [list, setList] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    api.get('/notifications').then((res) => setList(res.data));
  }, [refreshKey]);

  async function markRead(n) {
    await api.patch(`/notifications/${n._id}/read`);
    setRefreshKey((k) => k + 1);
  }

  async function markAll() {
    await api.patch('/notifications/read-all');
    setRefreshKey((k) => k + 1);
  }

  return (
    <section className="card narrow">
      <div className="row-between">
        <h1>Notifications</h1>
        <button className="btn-small" onClick={markAll}>
          Mark all read
        </button>
      </div>
      <p className="hint">Last 30 days, newest first</p>
      <ul className="list">
        {list.map((n) => (
          <li key={n._id} className={`list-row ${n.readAt ? 'muted' : ''}`}>
            <span className={`pill ${KIND[n.kind].tone}`}>{KIND[n.kind].label}</span>
            <div className="grow">
              {n.message}
              <div className="hint">
                {fmtDateTime(n.createdAt)}
                {n.emailedAt && ' · emailed'}
              </div>
            </div>
            {!n.readAt && (
              <button className="btn-small" onClick={() => markRead(n)}>
                OK
              </button>
            )}
          </li>
        ))}
      </ul>
      {list.length === 0 && <p className="hint">No notifications</p>}
    </section>
  );
}