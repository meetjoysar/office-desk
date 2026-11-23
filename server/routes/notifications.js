import { Router } from 'express';
import Notification from '../models/Notification.js';
import { protect, bossOnly } from '../middleware/auth.js';
import { runReminders, getLastRun } from '../jobs/reminders.js';
import { sendEmail, emailMode } from '../jobs/email.js';
import { HttpError } from '../utils.js';

const router = Router();
router.use(protect);

// GET /api/notifications → mine, last 30 days, newest first
router.get('/', async (req, res) => {
  const since = new Date(Date.now() - 30 * 86400000);
  res.json(
    await Notification.find({ user: req.user._id, createdAt: { $gte: since } })
      .sort({ createdAt: -1 })
      .limit(100)
  );
});

// GET /api/notifications/count → { unread }
router.get('/count', async (req, res) => {
  res.json({ unread: await Notification.countDocuments({ user: req.user._id, readAt: null }) });
});

router.patch('/read-all', async (req, res) => {
  await Notification.updateMany({ user: req.user._id, readAt: null }, { readAt: new Date() });
  res.json({ ok: true });
});

router.patch('/:id/read', async (req, res) => {
  await Notification.updateOne({ _id: req.params.id, user: req.user._id }, { readAt: new Date() });
  res.json({ ok: true });
});

// Boss tools for the dashboard
router.get('/status', bossOnly, (req, res) => {
  res.json({ email: emailMode(), lastRun: getLastRun() });
});

router.post('/run', bossOnly, async (req, res) => {
  res.json(await runReminders());
});

router.post('/test-email', bossOnly, async (req, res) => {
  if (!req.user.email) throw new HttpError(400, 'Add your email in Settings → Staff & PINs first');
  const result = await sendEmail({
    to: req.user.email,
    subject: 'Office Desk test email',
    text: 'Email reminders are working.',
  });
  if (!result.ok) throw new HttpError(400, result.error);
  res.json(result);
});

export default router;