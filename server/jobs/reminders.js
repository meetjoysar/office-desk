import Task from '../models/Task.js';
import Notification from '../models/Notification.js';
import { sendEmail } from './email.js';
import { todayStr, addDays, daysBetween, fmtDay } from '../utils.js';

let lastRun = null;
export const getLastRun = () => lastRun;

// Creates a notification, or returns null if this dedupeKey already exists
async function notify(data) {
  try {
    return await Notification.create(data);
  } catch (err) {
    if (err.code === 11000) return null;
    throw err;
  }
}

export async function runReminders() {
  const today = todayStr();
  const tasks = await Task.find({ isCancelled: false, status: { $ne: 'DONE' } })
    .populate('client', 'name')
    .populate('assignedTo', 'shortName email')
    .populate('assignedBy', 'shortName email');

  const created = []; // { note, person, task }

  for (const t of tasks) {
    const what = `${t.workName} for ${t.client.name}`;

    // 1. Due reminders on the days chosen for this task
    for (const d of t.reminderDays) {
      if (addDays(t.dueDate, -d) !== today) continue;
      const message =
        d === 0
          ? `${what} is due today`
          : `${what} is due on ${fmtDay(t.dueDate)} (in ${d} day${d > 1 ? 's' : ''})`;
      const note = await notify({
        user: t.assignedTo._id,
        task: t._id,
        kind: 'DUE_REMINDER',
        message,
        dedupeKey: `rem:${t._id}:${d}`,
      });
      if (note) created.push({ note, person: t.assignedTo, task: t });
    }

    if (t.dueDate >= today) continue; // not overdue
    const late = daysBetween(t.dueDate, today);

    // 2. Overdue: remind the assignee every 2 days (day 1, 3, 5 …)
    if (late % 2 === 1) {
      const note = await notify({
        user: t.assignedTo._id,
        task: t._id,
        kind: 'OVERDUE',
        message: `${what} was due on ${fmtDay(t.dueDate)}`,
        dedupeKey: `overdue:${t._id}:${today}`,
      });
      if (note) created.push({ note, person: t.assignedTo, task: t });
    }

    // 3. Tell the boss who assigned it, once
    if (t.notifyBossIfOverdue && !t.assignedBy._id.equals(t.assignedTo._id)) {
      const note = await notify({
        user: t.assignedBy._id,
        task: t._id,
        kind: 'OVERDUE_FOR_BOSS',
        message: `${what} (${t.assignedTo.shortName}) is overdue since ${fmtDay(t.dueDate)}`,
        dedupeKey: `overdue-boss:${t._id}`,
      });
      if (note) created.push({ note, person: t.assignedBy, task: t });
    }
  }

  // 4. One email per person listing all their new reminders
  const byPerson = new Map();
  for (const c of created) {
    if (!c.person.email || !c.task.emailReminders) continue;
    const key = String(c.person._id);
    if (!byPerson.has(key)) byPerson.set(key, { person: c.person, notes: [] });
    byPerson.get(key).notes.push(c.note);
  }

  let emailed = 0;
  for (const { person, notes } of byPerson.values()) {
    const result = await sendEmail({
      to: person.email,
      subject: `Office Desk: ${notes.length} reminder${notes.length > 1 ? 's' : ''} for today`,
      text: `Hello ${person.shortName},\n\n${notes.map((n) => `- ${n.message}`).join('\n')}\n\nOpen Office Desk to see your tasks.`,
    });
    const ids = notes.map((n) => n._id);
    if (result.ok) {
      emailed += 1;
      await Notification.updateMany({ _id: { $in: ids } }, { emailedAt: new Date() });
    } else {
      await Notification.updateMany({ _id: { $in: ids } }, { emailError: result.error });
    }
  }

  lastRun = { at: new Date(), created: created.length, emailed };
  return lastRun;
}