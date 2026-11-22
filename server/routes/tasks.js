import { Router } from 'express';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import Client from '../models/Client.js';
import Type from '../models/Type.js';
import User from '../models/User.js';
import { protect, bossOnly } from '../middleware/auth.js';
import { HttpError, todayStr } from '../utils.js';

const router = Router();
router.use(protect);

const isId = (v) => mongoose.isValidObjectId(v);
const DAYS = [0, 1, 2, 3, 7];

const populate = (query) =>
  query
    .populate('client', 'name')
    .populate('assignedTo', 'shortName fullName')
    .populate('assignedBy', 'shortName');

// Checks the task form and returns clean fields (used by create and edit)
async function cleanTask(body = {}, user) {
  const isBoss = user.role === 'BOSS';
  const { client, taskType, otherText = '', dueDate, note = '' } = body;
  const assignedTo = isBoss ? body.assignedTo : String(user._id); // staff: always themselves

  if (!isId(client) || !(await Client.exists({ _id: client, isActive: true })))
    throw new HttpError(400, 'Choose the client');
  const type =
    isId(taskType) && (await Type.findOne({ _id: taskType, kind: 'TASK', isActive: true }));
  if (!type) throw new HttpError(400, 'Choose the work');
  if (type.isOther && !otherText.trim())
    throw new HttpError(400, 'Type what the other work is');
  if (!isId(assignedTo) || !(await User.exists({ _id: assignedTo, isActive: true })))
    throw new HttpError(400, 'Choose who will do it');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate || ''))
    throw new HttpError(400, 'Choose the due date');
  if (dueDate < todayStr() && !isBoss)
    throw new HttpError(400, 'The due date cannot be in the past');

  return {
    client,
    taskType: type._id,
    workName: type.isOther ? otherText.trim() : type.name,
    assignedTo,
    dueDate,
    note,
    reminderDays: [...new Set((body.reminderDays || []).map(Number))].filter((d) =>
      DAYS.includes(d)
    ),
    emailReminders: body.emailReminders !== false,
    notifyBossIfOverdue: isBoss ? body.notifyBossIfOverdue !== false : false,
  };
}

// GET /api/tasks → boss: all tasks; staff (or ?mine=1): own tasks
router.get('/', async (req, res) => {
  const filter = { isCancelled: false };
  if (req.user.role !== 'BOSS' || req.query.mine === '1') filter.assignedTo = req.user._id;
  res.json(await populate(Task.find(filter)).sort({ dueDate: 1 }));
});

// GET /api/tasks/:id
router.get('/:id', async (req, res) => {
  const task = await populate(Task.findById(req.params.id));
  if (!task) throw new HttpError(404, 'Task not found');
  if (req.user.role !== 'BOSS' && !task.assignedTo._id.equals(req.user._id))
    throw new HttpError(403, 'Not your task');
  res.json(task);
});

// POST /api/tasks
router.post('/', async (req, res) => {
  const data = await cleanTask(req.body, req.user);
  const task = await Task.create({ ...data, assignedBy: req.user._id });
  // Part 6 adds an "assigned" notification here
  res.status(201).json(task);
});

// PUT /api/tasks/:id   (boss)
router.put('/:id', bossOnly, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  Object.assign(task, await cleanTask(req.body, req.user));
  await task.save();
  res.json(task);
});

// PATCH /api/tasks/:id/status { status }   (the assignee or a boss)
router.patch('/:id/status', async (req, res) => {
  const { status } = req.body ?? {};
  if (!['TODO', 'IN_PROGRESS', 'DONE'].includes(status))
    throw new HttpError(400, 'Unknown status');
  const task = await Task.findById(req.params.id);
  if (!task || task.isCancelled) throw new HttpError(404, 'Task not found');
  if (req.user.role !== 'BOSS' && !task.assignedTo.equals(req.user._id))
    throw new HttpError(403, 'Not your task');

  task.status = status;
  if (status === 'IN_PROGRESS' && !task.startedAt) task.startedAt = new Date();
  task.doneAt = status === 'DONE' ? task.doneAt ?? new Date() : null; // leaving Done clears doneAt
  await task.save();
  res.json(task);
});

// PATCH /api/tasks/:id/cancel   (boss)
router.patch('/:id/cancel', bossOnly, async (req, res) => {
  const task = await Task.findById(req.params.id);
  if (!task) throw new HttpError(404, 'Task not found');
  task.isCancelled = true;
  await task.save();
  res.json(task);
});

export default router;