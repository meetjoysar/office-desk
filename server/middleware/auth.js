import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Runs before protected routes. Reads the token and attaches the user to req.user
export async function protect(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Please log in' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).select('-pinHash');
    if (!user || !user.isActive) return res.status(401).json({ message: 'Please log in' });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Session expired, log in again' });
  }
}

// Use after protect on boss-only routes
export function bossOnly(req, res, next) {
  if (req.user.role !== 'BOSS') {
    return res.status(403).json({ message: 'Only bosses can do this' });
  }
  next();
}