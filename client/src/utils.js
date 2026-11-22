export const initials = (name = '') =>
  name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

export const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

export const fmtTime = (d) => new Date(d).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

export const fmtDateTime = (d) => `${fmtDate(d)}, ${fmtTime(d)}`;

export const placeText = (p) => `${p.officeName} · Cupboard ${p.cupboard} · Row ${p.row}`;

export const dateStr = (d) =>
  new Date(d).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
export const todayStr = () => dateStr(new Date());
export const addDays = (s, n) => {
  const d = new Date(`${s}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const daysBetween = (a, b) =>
  Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
export const fmtDay = (s) =>
  new Date(`${s}T00:00:00Z`).toLocaleDateString('en-IN', {
    timeZone: 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

export const isOverdue = (t) => t.status !== 'DONE' && t.dueDate < todayStr();
export const isDueSoon = (t) =>
  t.status !== 'DONE' && t.dueDate >= todayStr() && t.dueDate <= addDays(todayStr(), 1);

export function dueInfo(t) {
  if (t.status === 'DONE') return { label: 'Completed', tone: 'grey' };
  const diff = daysBetween(todayStr(), t.dueDate);
  if (diff < 0) return { label: `Overdue ${-diff} day${diff < -1 ? 's' : ''}`, tone: 'red' };
  if (diff === 0) return { label: 'Due today', tone: 'orange' };
  if (diff === 1) return { label: 'Due tomorrow', tone: 'orange' };
  return { label: `In ${diff} days`, tone: 'grey' };
}

export const TASK_FILTERS = [
  ['NOT_DONE', 'Not done'],
  ['TODO', 'To Do'],
  ['IN_PROGRESS', 'In Progress'],
  ['DONE', 'Done'],
  ['ALL', 'All'],
];
export const matchesFilter = (t, f) =>
  f === 'ALL' || (f === 'NOT_DONE' ? t.status !== 'DONE' : t.status === f);

// Not-done tasks by nearest due date, then done tasks by most recently finished
export function sortTasks(list) {
  const notDone = list
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const done = list
    .filter((t) => t.status === 'DONE')
    .sort((a, b) => new Date(b.doneAt) - new Date(a.doneAt));
  return [...notDone, ...done];
}