import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { randomInt } from 'node:crypto';
import User from '../models/User.js';
import { protect, bossOnly } from '../middleware/auth.js';
import mongoose from 'mongoose';
import Task from '../models/Task.js';
import { HttpError } from '../utils.js';

const router = Router();
router.use(protect, bossOnly); // whole file is boss-only

// 0000, 1111 … 9999, 1234, 4321 are too easy to guess
const OBVIOUS = [...'0123456789'].map((d) => d.repeat(4)).concat(['1234', '4321']);

function makePin() {
  let pin;
  do {
    pin = String(randomInt(0, 10000)).padStart(4, '0');
  } while (OBVIOUS.includes(pin));
  return pin;
}

// Allowed fields only; drops any that were not sent
const pick = (b = {}) =>
  Object.fromEntries(
    Object.entries({
      fullName: b.fullName,
      shortName: b.shortName?.trim() || b.fullName?.trim().split(' ')[0],
      role: b.role,
      email: b.email,
      mobile: b.mobile,
    }).filter(([, v]) => v !== undefined)
  );

// The office must always have at least one active boss
async function isLastBoss(user) {
  if (user.role !== 'BOSS' || !user.isActive) return false;
  return (await User.countDocuments({ role: 'BOSS', isActive: true })) <= 1;
}

// GET /api/users → everyone, including people who have left
router.get('/', async (req, res) => {
  const users = await User.find().sort({ isActive: -1, role: 1, shortName: 1 });
  res.json(users);
});

// POST /api/users → add a person, returns their PIN once
router.post('/', async (req, res) => {
  const pin = makePin();
  const user = await User.create({ ...pick(req.body), pinHash: await bcrypt.hash(pin, 10) });
  res.status(201).json({ user, pin });
});

// PUT /api/users/:id → edit details
router.put('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Person not found' });
  if (req.body?.role === 'STAFF' && (await isLastBoss(user))) {
    return res.status(400).json({ message: 'At least one boss is needed' });
  }
  Object.assign(user, pick(req.body));
  await user.save();
  res.json(user);
});

// POST /api/users/:id/reset-pin → new PIN, shown once
router.post('/:id/reset-pin', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Person not found' });
  const pin = makePin();
  user.pinHash = await bcrypt.hash(pin, 10);
  await user.save();
  res.json({ pin });
});

// PATCH /api/users/:id/active { isActive } → "has left the office" / bring back
router.patch('/:id/active', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'Person not found' });
  if (user._id.equals(req.user._id)) {
    return res.status(400).json({ message: 'You cannot remove yourself' });
  }
  const isActive = Boolean(req.body?.isActive);
  if (!isActive && (await isLastBoss(user))) {
    return res.status(400).json({ message: 'At least one boss is needed' });
  }
  if (!isActive) {
    const openFilter = { assignedTo: user._id, status: { $ne: 'DONE' }, isCancelled: false };
    const openCount = await Task.countDocuments(openFilter);
    if (openCount > 0) {
      const to = req.body?.moveTasksTo;
      const ok =
        mongoose.isValidObjectId(to) &&
        !user._id.equals(to) &&
        (await User.exists({ _id: to, isActive: true }));
      if (!ok) throw new HttpError(400, `Choose who takes their ${openCount} open tasks`);
      await Task.updateMany(openFilter, { assignedTo: to });
    }
  }
  user.isActive = isActive;
  await user.save();
  res.json(user);
});

export default router;