import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import DueChip from '../components/DueChip';
import { daysBetween, dateStr, todayStr, fmtDate } from '../utils';

export default function Dashboard() {
  const [data, setData] = useState(null);

  useEffect(() => {
    api.get('/dashboard').then((res) => setData(res.data));
  }, []);

  if (!data) return <p className="hint">Loading…</p>;
  const { counts, team, urgent, held } = data;

  const tiles = [
    ['Overdue tasks', counts.overdue, 'Need attention now', '/tasks?overdue=1', 'red'],
    ['Due in 3 days', counts.dueSoon, 'Across all staff', '/tasks', 'orange'],
    ['In progress', counts.inProgress, 'Being worked on', '/tasks?status=IN_PROGRESS', ''],
    ['Documents with us', counts.docsWithUs, 'Received, not returned', '/documents', ''],
  ];

  return (
    <>
      <div className="row-between">
        <div>
          <h1>Office today</h1>
          <p className="hint">{fmtDate(todayStr())}</p>
        </div>
        <Link to="/tasks/new" className="btn-link">
          Assign a task
        </Link>
      </div>

      {/* Part 6 adds the reminders panel here */}

      <div className="stat-tiles">
        {tiles.map(([label, n, sub, to, tone]) => (
          <Link key={label} to={to} className={`card stat ${tone}`}>
            <div className="stat-num">{n}</div>
            <strong>{label}</strong>
            <div className="hint">{sub}</div>
          </Link>
        ))}
      </div>

      <section className="card">
        <h2>Team work</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>To Do</th>
              <th>In Progress</th>
              <th>Done this month</th>
              <th>Overdue</th>
            </tr>
          </thead>
          <tbody>
            {team.map((u) => (
              <tr key={u._id}>
                <td>
                  <Link to={`/tasks?person=${u._id}`}>{u.shortName}</Link>
                </td>
                <td>{u.todo}</td>
                <td>{u.inProgress}</td>
                <td>{u.doneThisMonth}</td>
                <td>{u.overdue > 0 ? <span className="pill red">{u.overdue}</span> : 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="two-equal">
        <section className="card">
          <h2>Overdue and due soon</h2>
          {urgent.map((t) => (
            <div key={t._id} className="task-row">
              <div className="grow">
                <strong>{t.workName}</strong>
                <div className="hint">
                  {t.client?.name} · {t.assignedTo?.shortName}
                </div>
              </div>
              <DueChip task={t} />
            </div>
          ))}
          {urgent.length === 0 && <p className="hint">Nothing urgent</p>}
        </section>

        <section className="card">
          <h2>Documents still with us</h2>
          <p className="hint">Longest held first</p>
          {held.map((c) => (
            <div key={c._id} className="task-row">
              <div className="grow">
                <strong>{c.clientName}</strong>
                <div className="hint">
                  {c.docs.slice(0, 3).join(' · ')}
                  {c.docs.length > 3 && ` · ${c.docs.length - 3} others`}
                </div>
              </div>
              {c.originals > 0 && <span className="tag dark">Original</span>}
              <span className="hint">{daysBetween(dateStr(c.oldest), todayStr())} days</span>
            </div>
          ))}
          {held.length === 0 && <p className="hint">Nothing held</p>}
        </section>
      </div>
    </>
  );
}