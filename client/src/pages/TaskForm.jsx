import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../useAuth';
import ClientPicker from '../components/ClientPicker';
import { todayStr, addDays, fmtDay, initials } from '../utils';

const DAY_OPTIONS = [
  [0, 'On due date'],
  [1, '1 day before'],
  [2, '2 days before'],
  [3, '3 days before'],
  [7, '1 week before'],
];

function monthEnd(s) {
  const [y, m] = s.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10); // day 0 of next month = last day of this month
}

export default function TaskForm() {
  const { id } = useParams(); // present when editing
  const { user } = useAuth();
  const navigate = useNavigate();
  const isBoss = user.role === 'BOSS';
  const today = todayStr();

  const [types, setTypes] = useState([]);
  const [people, setPeople] = useState([]);
  const [openCounts, setOpenCounts] = useState({});
  const [client, setClient] = useState(null);
  const [taskType, setTaskType] = useState(null);
  const [otherText, setOtherText] = useState('');
  const [assignedTo, setAssignedTo] = useState(isBoss ? null : user._id);
  const [dueDate, setDueDate] = useState('');
  const [reminderDays, setReminderDays] = useState([0, 1, 3]);
  const [emailReminders, setEmailReminders] = useState(true);
  const [notifyBoss, setNotifyBoss] = useState(true);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/types', { params: { kind: 'TASK' } }).then((res) => setTypes(res.data));
    if (!isBoss) return;
    api.get('/auth/users').then((res) => setPeople(res.data));
    api.get('/tasks').then((res) => {
      const counts = {};
      res.data
        .filter((t) => t.status !== 'DONE')
        .forEach((t) => {
          counts[t.assignedTo?._id] = (counts[t.assignedTo?._id] || 0) + 1;
        });
      setOpenCounts(counts);
    });
  }, [isBoss]);

  // Editing: load the task into the form
  useEffect(() => {
    if (!id) return;
    api.get(`/tasks/${id}`).then(({ data: t }) => {
      setClient(t.client);
      setTaskType(t.taskType);
      setOtherText(t.workName);
      setAssignedTo(t.assignedTo._id);
      setDueDate(t.dueDate);
      setReminderDays(t.reminderDays);
      setEmailReminders(t.emailReminders);
      setNotifyBoss(t.notifyBossIfOverdue);
      setNote(t.note);
    });
  }, [id]);

  const selectedType = types.find((t) => t._id === taskType);
  const person = isBoss ? people.find((p) => p._id === assignedTo) : user;

  function pickClient(c) {
    setClient(c);
    if (isBoss && !id && c?.usualStaff) setAssignedTo(c.usualStaff._id); // pre-select usual staff
  }

  const toggleDay = (d) =>
    setReminderDays((ds) => (ds.includes(d) ? ds.filter((x) => x !== d) : [...ds, d]));

  const DUE_CHIPS = [
    ['Today', today],
    ['Tomorrow', addDays(today, 1)],
    ['In 3 days', addDays(today, 3)],
    ['In 1 week', addDays(today, 7)],
    ['Month end', monthEnd(today)],
  ];

  const remindOn = dueDate
    ? [...reminderDays]
        .sort((a, b) => b - a)
        .map((d) => addDays(dueDate, -d))
        .filter((d) => d >= today)
    : [];

  async function save() {
    setError('');
    const body = {
      client: client?._id,
      taskType,
      otherText,
      assignedTo,
      dueDate,
      reminderDays,
      emailReminders,
      notifyBossIfOverdue: notifyBoss,
      note,
    };
    try {
      if (id) await api.put(`/tasks/${id}`, body);
      else await api.post('/tasks', body);
      navigate(isBoss ? '/tasks' : '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save');
    }
  }

  return (
    <div className="form-page">
      <h1>{id ? 'Edit task' : isBoss ? 'Assign a task' : 'Add my task'}</h1>

      <section className="card">
        <h2>1. Client</h2>
        <ClientPicker value={client} onChange={pickClient} />
      </section>

      <section className="card">
        <h2>2. What work?</h2>
        <div className="type-grid three">
          {types.map((t) => (
            <button
              type="button"
              key={t._id}
              className={`toggle ${taskType === t._id ? 'selected' : ''}`}
              onClick={() => setTaskType(t._id)}
            >
              {t.name}
            </button>
          ))}
        </div>
        {selectedType?.isOther && (
          <div className="reveal">
            <label>
              What is the other work?
              <input
                className="input"
                value={otherText}
                onChange={(e) => setOtherText(e.target.value)}
              />
            </label>
          </div>
        )}
      </section>

      <section className="card">
        <h2>3. Give to</h2>
        {isBoss ? (
          <div className="tiles six">
            {people.map((p) => (
              <button
                type="button"
                key={p._id}
                className={`tile ${assignedTo === p._id ? 'selected' : ''}`}
                onClick={() => setAssignedTo(p._id)}
              >
                <span className="avatar">{initials(p.fullName)}</span>
                <strong>{p.shortName}</strong>
                <small>{openCounts[p._id] || 0} open</small>
              </button>
            ))}
          </div>
        ) : (
          <p>
            <strong>{user.shortName}</strong> (yourself)
          </p>
        )}
      </section>

      <section className="card">
        <div className="row-between">
          <h2>4. Due date</h2>
          {dueDate && <strong>{fmtDay(dueDate)}</strong>}
        </div>
        <div className="chips">
          {DUE_CHIPS.map(([label, d]) => (
            <button
              type="button"
              key={label}
              className={`chip ${dueDate === d ? 'selected' : ''}`}
              onClick={() => setDueDate(d)}
            >
              {label}
            </button>
          ))}
          <input
            type="date"
            className="input date"
            value={dueDate}
            min={isBoss ? undefined : today}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        {dueDate && dueDate < today && <p className="warn">This date is in the past.</p>}
      </section>

      <section className="card">
        <h2>5. Reminders for this task</h2>
        <p className="label">When? (tap one or more)</p>
        <div className="chips">
          {DAY_OPTIONS.map(([d, label]) => (
            <button
              type="button"
              key={d}
              className={`chip ${reminderDays.includes(d) ? 'selected' : ''}`}
              onClick={() => toggleDay(d)}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="label">How?</p>
        <div className="chips">
          <span className="chip static">On screen · always on</span>
          <button
            type="button"
            className={`chip ${emailReminders ? 'selected' : ''}`}
            onClick={() => setEmailReminders((v) => !v)}
          >
            Email · {emailReminders ? 'on' : 'off'}
          </button>
        </div>
        {isBoss && (
          <label className="check">
            <input
              type="checkbox"
              checked={notifyBoss}
              onChange={(e) => setNotifyBoss(e.target.checked)}
            />
            Tell me too if it becomes overdue
          </label>
        )}
        {dueDate && person && (
          <div className="info-line">
            {remindOn.length
              ? `${person.shortName} will be reminded on: ${remindOn.map(fmtDay).join(' · ')} (9:00 AM)`
              : 'No reminder dates are left before the due date.'}
          </div>
        )}
      </section>

      <label>
        Note (optional)
        <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {error && <p className="error">{error}</p>}
      <div className="btn-row">
        <button className="btn-primary" onClick={save}>
          {id
            ? 'Save changes'
            : isBoss
              ? `Assign${person ? ` to ${person.shortName}` : ''}`
              : 'Add my task'}
        </button>
        <button className="btn-secondary" onClick={() => navigate(-1)}>
          Cancel
        </button>
      </div>
    </div>
  );
}