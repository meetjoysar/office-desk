import { Router } from 'express';
import mongoose from 'mongoose';
import Inward from '../models/Inward.js';
import Client from '../models/Client.js';
import Office from '../models/Office.js';
import Type from '../models/Type.js';
import { nextNumber } from '../models/Counter.js';
import { protect } from '../middleware/auth.js';
import { HttpError, escapeRegex } from '../utils.js';

const router = Router();
router.use(protect);
const isId = (v) => mongoose.isValidObjectId(v);

// POST /api/inwards → save a new Inward entry
router.post('/', async (req, res) => {
  const { client, source, thirdPartyName = '', place = {}, items = [], note = '' } = req.body ?? {};

  if (!isId(client) || !(await Client.exists({ _id: client, isActive: true }))) {
    throw new HttpError(400, 'Choose the client');
  }
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Choose at least one document');
  if (!['DIRECT', 'THIRD_PARTY'].includes(source)) throw new HttpError(400, 'Choose who gave the documents');
  if (source === 'THIRD_PARTY' && !thirdPartyName.trim()) {
    throw new HttpError(400, 'Type the name of the person who brought them');
  }

  // Check every document line
  const types = await Type.find({ _id: { $in: items.map((i) => i.docType).filter(isId) }, kind: 'DOC' });
  const typeById = new Map(types.map((t) => [String(t._id), t]));
  const seen = new Set();

  const cleanItems = items.map((i) => {
    const type = typeById.get(String(i.docType));
    if (!type) throw new HttpError(400, 'Unknown document type');
    if (type.isOther && !i.otherText?.trim()) throw new HttpError(400, 'Type what the other document is');
    if (!type.isOther) {
      if (seen.has(String(type._id))) throw new HttpError(400, `${type.name} is chosen twice`);
      seen.add(String(type._id));
    }
    return {
      docType: type._id,
      docName: type.isOther ? i.otherText.trim() : type.name,
      copyKind: i.copyKind,
      originalKind: i.originalKind,
    };
  });

  // Check the storage place
  const office = isId(place.office) && (await Office.findOne({ _id: place.office, isActive: true }));
  if (!office) throw new HttpError(400, 'Choose where the documents are kept');
  const cupboard = Number(place.cupboard);
  const row = Number(place.row);
  if (!(cupboard >= 1 && cupboard <= office.cupboards && row >= 1 && row <= office.rowsPerCupboard)) {
    throw new HttpError(400, 'Choose the cupboard and row');
  }

  const inward = await Inward.create({
    number: await nextNumber('IN'),
    client,
    source,
    thirdPartyName: source === 'THIRD_PARTY' ? thirdPartyName.trim() : '',
    place: { office: office._id, officeName: office.name, cupboard, row },
    items: cleanItems,
    receivedBy: req.user._id, // set by the server, not the browser
    note,
  });
  res.status(201).json(inward);
});

// GET /api/inwards/client-info?client=ID → last place used + names of people who brought docs before
router.get('/client-info', async (req, res) => {
  const { client } = req.query;
  if (!isId(client)) throw new HttpError(400, 'Invalid client');
  const last = await Inward.findOne({ client, isCancelled: false }).sort({ receivedAt: -1 });
  const names = await Inward.distinct('thirdPartyName', { client, source: 'THIRD_PARTY' });
  res.json({ lastPlace: last?.place ?? null, thirdPartyNames: names.filter(Boolean) });
});

// GET /api/inwards/with-us?client=ID → Inward entries that still have documents with us
router.get('/with-us', async (req, res) => {
  const { client } = req.query;
  if (!isId(client)) throw new HttpError(400, 'Invalid client');
  const inwards = await Inward.find({ client, isCancelled: false, 'items.returnedIn': null })
    .populate('receivedBy', 'shortName')
    .sort({ receivedAt: -1 });
  res.json(inwards);
});

// GET /api/inwards/register?status=with|returned|all&search=  → one row per document
router.get('/register', async (req, res) => {
  const { status = 'with', search = '' } = req.query;

  const pipeline = [
    { $match: { isCancelled: false } },
    { $unwind: '$items' }, // one row per document instead of per Inward entry
  ];
  if (status === 'with') pipeline.push({ $match: { 'items.returnedIn': null } });
  if (status === 'returned') pipeline.push({ $match: { 'items.returnedIn': { $ne: null } } });

  pipeline.push(
    { $lookup: { from: 'clients', localField: 'client', foreignField: '_id', as: 'client' } },
    { $unwind: '$client' },
    { $lookup: { from: 'users', localField: 'receivedBy', foreignField: '_id', as: 'receivedBy' } },
    { $unwind: '$receivedBy' },
    { $lookup: { from: 'outwards', localField: 'items.returnedIn', foreignField: '_id', as: 'outward' } }
  );

  if (search.trim()) {
    const rx = new RegExp(escapeRegex(search.trim()), 'i');
    pipeline.push({ $match: { $or: [{ 'client.name': rx }, { 'items.docName': rx }] } });
  }

  pipeline.push(
    { $sort: { receivedAt: -1 } },
    { $limit: 300 },
    {
      $project: {
        _id: '$items._id',
        number: 1,
        place: 1,
        receivedAt: 1,
        docName: '$items.docName',
        copyKind: '$items.copyKind',
        originalKind: '$items.originalKind',
        returnedAt: '$items.returnedAt',
        clientName: '$client.name',
        receivedBy: '$receivedBy.shortName',
        outward: { $first: '$outward' },
      },
    }
  );

  res.json(await Inward.aggregate(pipeline));
});

export default router;