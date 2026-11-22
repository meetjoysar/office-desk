import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import TaskRow from '../components/TaskRow';
import {
  TASK_FILTERS,
  matchesFilter,
  sortTasks,
  isOverdue,
  isDueSoon,
  dateStr,
  todayStr,
} from '../utils';

export default function MyWork() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('NOT_DONE');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/tasks', { params: { mine: 1 } }).then((res) => setTasks(res.data));
  }, []);

  // Save the new status, then update just that row (no page reload)
  async function changeStatus(task, status) {
    const res = await api.patch(`/tasks/${task._id}/status`, { status });
    const { startedAt, doneAt } = res.data;
    setTasks((ts) =>
      ts.map((t) => (t._id === task._id ? { ...t, status, startedAt, doneAt } : t))
    );
  }

  const month = todayStr().slice(0, 7);
  const tiles = [
    ['Overdue', tasks.filter(isOverdue).length, 'red'],
    ['Due today / tomorrow', tasks.filter(isDueSoon).length, 'orange'],
    ['In progress', tasks.filter((t) => t.status === 'IN_PROGRESS').length, ''],
    [
      'Done this month',
      tasks.filter((t) => t.doneAt && dateStr(t.doneAt).startsWith(month)).length,
      'green',
    ],
  ];

  const q = search.trim().toLowerCase();
  const shown = sortTasks(
    tasks.filter(
      (t) =>
        matchesFilter(t, filter) &&
        (!q || t.workName.toLowerCase().includes(q) || t.client?.name.toLowerCase().includes(q))
    )
  );

  return (
    <>
      {/* Part 6 adds the reminder banner here */}

      <div className="actions3">
        <Link to="/inward" className="action-card">
          <strong>Document received</strong>
          <span>Make an Inward entry</span>
        </Link>
        <Link to="/outward" className="action-card">
          <strong>Document returned</strong>
          <span>Make an Outward entry</span>
        </Link>
        <Link to="/tasks/new" className="action-card">
          <strong>Add my task</strong>
          <span>Work you want to track</span>
        </Link>
      </div>

      <div className="stat-tiles">
        {tiles.map(([label, n, tone]) => (
          <div key={label} className={`card stat ${tone}`}>
            <div className="stat-num">{n}</div>
            {label}
          </div>
        ))}
      </div>

      <section className="card">
        <div className="row-between">
          <h2>My tasks</h2>
          <span className="hint">Nearest due date first</span>
        </div>
        <input
          className="input"
          placeholder="Search tasks"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chips">
          {TASK_FILTERS.map(([v, l]) => (
            <button
              key={v}
              className={`chip ${filter === v ? 'selected' : ''}`}
              onClick={() => setFilter(v)}
            >
              {l} · {tasks.filter((t) => matchesFilter(t, v)).length}
            </button>
          ))}
        </div>
        {shown.map((t) => (
          <TaskRow key={t._id} task={t} onStatus={changeStatus} />
        ))}
        {shown.length === 0 && <p className="hint">No tasks here</p>}
      </section>
    </>
  );
}