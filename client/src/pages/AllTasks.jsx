import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../api';
import TaskRow from '../components/TaskRow';
import { TASK_FILTERS, matchesFilter, sortTasks, isOverdue } from '../utils';

export default function AllTasks() {
  const [params] = useSearchParams(); // filters can come from Dashboard links
  const [tasks, setTasks] = useState([]);
  const [people, setPeople] = useState([]);
  const [filter, setFilter] = useState(params.get('status') || 'NOT_DONE');
  const [person, setPerson] = useState(params.get('person') || '');
  const [overdueOnly, setOverdueOnly] = useState(params.get('overdue') === '1');
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/tasks').then((res) => setTasks(res.data));
    api.get('/auth/users').then((res) => setPeople(res.data));
  }, []);

  async function changeStatus(task, status) {
    const res = await api.patch(`/tasks/${task._id}/status`, { status });
    const { startedAt, doneAt } = res.data;
    setTasks((ts) =>
      ts.map((t) => (t._id === task._id ? { ...t, status, startedAt, doneAt } : t))
    );
  }

  async function cancelTask(task) {
    if (!window.confirm(`Cancel "${task.workName}" for ${task.client?.name}?`)) return;
    await api.patch(`/tasks/${task._id}/cancel`);
    setTasks((ts) => ts.filter((t) => t._id !== task._id));
  }

  const q = search.trim().toLowerCase();
  const shown = sortTasks(
    tasks.filter(
      (t) =>
        matchesFilter(t, filter) &&
        (!person || t.assignedTo?._id === person) &&
        (!overdueOnly || isOverdue(t)) &&
        (!q || t.workName.toLowerCase().includes(q) || t.client?.name.toLowerCase().includes(q))
    )
  );

  return (
    <>
      <div className="row-between">
        <h1>All tasks</h1>
        <Link to="/tasks/new" className="btn-link">
          Assign a task
        </Link>
      </div>
      <section className="card">
        <input
          className="input"
          placeholder="Search work or client"
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
              {l}
            </button>
          ))}
          <button
            className={`chip ${overdueOnly ? 'selected' : ''}`}
            onClick={() => setOverdueOnly((o) => !o)}
          >
            Overdue only
          </button>
        </div>
        <div className="chips">
          <button
            className={`chip ${person === '' ? 'selected' : ''}`}
            onClick={() => setPerson('')}
          >
            Everyone
          </button>
          {people.map((p) => (
            <button
              key={p._id}
              className={`chip ${person === p._id ? 'selected' : ''}`}
              onClick={() => setPerson(p._id)}
            >
              {p.shortName}
            </button>
          ))}
        </div>

        {shown.map((t) => (
          <TaskRow key={t._id} task={t} showPerson onStatus={changeStatus}>
            <Link className="btn-small" to={`/tasks/${t._id}/edit`}>
              Edit
            </Link>
            <button className="btn-small danger" onClick={() => cancelTask(t)}>
              Cancel
            </button>
          </TaskRow>
        ))}
        {shown.length === 0 && <p className="hint">No tasks here</p>}
      </section>
    </>
  );
}