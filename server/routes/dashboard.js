import { Router } from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Inward from '../models/Inward.js';
import { protect, bossOnly } from '../middleware/auth.js';
import { todayStr, addDays } from '../utils.js';

const router = Router();

// GET /api/dashboard   (boss)
router.get('/', protect, bossOnly, async (req, res) => {
  const today = todayStr();
  const monthStart = new Date(`${today.slice(0, 7)}-01T00:00:00+05:30`);

  const [tasks, users, held] = await Promise.all([
    Task.find({ isCancelled: false })
      .populate('client', 'name')
      .populate('assignedTo', 'shortName'),
    User.find({ isActive: true }).sort({ role: 1, shortName: 1 }),
    // Documents still with us, grouped per client, oldest first
    Inward.aggregate([
      { $match: { isCancelled: false } },
      { $unwind: '$items' },
      { $match: { 'items.returnedIn': null } },
      {
        $group: {
          _id: '$client',
          docs: { $push: '$items.docName' },
          oldest: { $min: '$receivedAt' },
          originals: {
            $sum: { $cond: [{ $eq: ['$items.originalKind', 'ORIGINAL'] }, 1, 0] },
          },
        },
      },
      { $sort: { oldest: 1 } },
      { $lookup: { from: 'clients', localField: '_id', foreignField: '_id', as: 'client' } },
      { $unwind: '$client' },
      { $project: { clientName: '$client.name', docs: 1, oldest: 1, originals: 1 } },
    ]),
  ]);

  const open = tasks.filter((t) => t.status !== 'DONE');
  const team = users.map((u) => {
    const mine = tasks.filter((t) => t.assignedTo?._id.equals(u._id));
    return {
      _id: u._id,
      shortName: u.shortName,
      todo: mine.filter((t) => t.status === 'TODO').length,
      inProgress: mine.filter((t) => t.status === 'IN_PROGRESS').length,
      doneThisMonth: mine.filter((t) => t.status === 'DONE' && t.doneAt >= monthStart).length,
      overdue: mine.filter((t) => t.status !== 'DONE' && t.dueDate < today).length,
    };
  });

  res.json({
    counts: {
      overdue: open.filter((t) => t.dueDate < today).length,
      dueSoon: open.filter((t) => t.dueDate >= today && t.dueDate <= addDays(today, 3)).length,
      inProgress: open.filter((t) => t.status === 'IN_PROGRESS').length,
      docsWithUs: held.reduce((n, c) => n + c.docs.length, 0),
    },
    team,
    urgent: open
      .filter((t) => t.dueDate <= addDays(today, 1))
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 8),
    held: held.slice(0, 8),
  });
});

export default router;