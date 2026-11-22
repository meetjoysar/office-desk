import { Router } from 'express';
import Office from '../models/Office.js';
import { protect, bossOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect);

const pick = (b = {}) =>
  Object.fromEntries(
    Object.entries({ name: b.name, cupboards: b.cupboards, rowsPerCupboard: b.rowsPerCupboard })
      .filter(([, v]) => v !== undefined)
  );

// GET /api/offices  (everyone, the Inward screen will need it)
router.get('/', async (req, res) => {
  res.json(await Office.find({ isActive: true }).sort({ name: 1 }));
});

// POST /api/offices { name }  (boss) → starts with 1 cupboard × 4 rows
router.post('/', bossOnly, async (req, res) => {
  const office = await Office.create(pick(req.body));
  res.status(201).json(office);
});

// PUT /api/offices/:id { name?, cupboards?, rowsPerCupboard? }  (boss)
router.put('/:id', bossOnly, async (req, res) => {
  const office = await Office.findById(req.params.id);
  if (!office) return res.status(404).json({ message: 'Office not found' });
  Object.assign(office, pick(req.body));
  await office.save();
  res.json(office);
});

export default router;