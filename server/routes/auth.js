import { Router } from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// GET /api/auth/users → names for the login tiles (public, no PINs)
router.get('/users', async (req, res) => {
  const users = await User.find({ isActive: true })
    .select('fullName shortName role')
    .sort({ role: 1, shortName: 1 }); // BOSS comes before STAFF
  res.json(users);
});

// POST /api/auth/login  { userId, pin } → { token, user }
router.post('/login', async (req, res) => {
  const { userId, pin } = req.body ?? {};
  if (!mongoose.isValidObjectId(userId) || !pin) {
    return res.status(400).json({ message: 'Choose your name and enter your PIN' });
  }

  const user = await User.findById(userId);
  const ok = user && user.isActive && (await bcrypt.compare(String(pin), user.pinHash));
  if (!ok) return res.status(401).json({ message: 'Wrong PIN, try again' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: '8h',
  });

  res.json({
    token,
    user: { _id: user._id, fullName: user.fullName, shortName: user.shortName, role: user.role },
  });
});

// GET /api/auth/me → who am I? (checks the token works)
router.get('/me', protect, (req, res) => res.json(req.user));

export default router;