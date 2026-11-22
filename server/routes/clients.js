import { Router } from 'express';
import Client from '../models/Client.js';
import { protect, bossOnly } from '../middleware/auth.js';

const router = Router();
router.use(protect); // every route below needs login

// Makes user text safe to use inside a regex search
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Only take the fields we allow from the request body
const pick = (b = {}) => ({
  name: b.name,
  clientType: b.clientType,
  mobile: b.mobile,
  email: b.email,
  usualStaff: b.usualStaff || null,
});

// GET /api/clients?search=pat&status=active|hidden  (everyone)
router.get('/', async (req, res) => {
  const { search = '', status = 'active' } = req.query;
  const filter = { isActive: status !== 'hidden' };
  if (search.trim()) filter.name = { $regex: escapeRegex(search.trim()), $options: 'i' };

  const clients = await Client.find(filter)
    .populate('usualStaff', 'shortName') // replaces the id with { _id, shortName }
    .sort({ name: 1 });
  res.json(clients);
});

// POST /api/clients  (boss)
router.post('/', bossOnly, async (req, res) => {
  const client = await Client.create({ ...pick(req.body), createdBy: req.user._id });
  res.status(201).json(client);
});

// PUT /api/clients/:id  (boss)
router.put('/:id', bossOnly, async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  Object.assign(client, pick(req.body));
  await client.save(); // runs the schema validation again
  res.json(client);
});

// PATCH /api/clients/:id/active  { isActive }  (boss) — hide / show
router.patch('/:id/active', bossOnly, async (req, res) => {
  const client = await Client.findById(req.params.id);
  if (!client) return res.status(404).json({ message: 'Client not found' });
  client.isActive = Boolean(req.body?.isActive);
  await client.save();
  res.json(client);
});

export default router;