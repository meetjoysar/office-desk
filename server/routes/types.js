import { Router } from 'express';
import Type from '../models/Type.js';
import { protect, bossOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

// GET /api/types?kind=DOC  (add &all=1 to include hidden ones)
router.get('/', async (req, res) => {
  const { kind, all } = req.query;
  if (!['DOC', 'TASK'].includes(kind)) return res.status(400).json({ message: 'kind must be DOC or TASK' });
  const filter = { kind };
  if (all !== '1') filter.isActive = true;
  const types = await Type.find(filter).sort({ isOther: 1, order: 1 }); // "Other…" always last
  res.json(types);
});

// POST /api/types { kind, name }  (boss)
router.post('/', bossOnly, async (req, res) => {
  const { kind, name } = req.body ?? {};
  const order = await Type.countDocuments({ kind });
  const type = await Type.create({ kind, name, order });
  res.status(201).json(type);
});

// PATCH /api/types/:id { name?, isActive? }  (boss)
router.patch('/:id', bossOnly, async (req, res) => {
  const type = await Type.findById(req.params.id);
  if (!type) return res.status(404).json({ message: 'Not found' });
  if (type.isOther) return res.status(400).json({ message: '"Other…" cannot be changed' });
  if (req.body?.name !== undefined) type.name = req.body.name;
  if (req.body?.isActive !== undefined) type.isActive = Boolean(req.body.isActive);
  await type.save();
  res.json(type);
});

export default router;