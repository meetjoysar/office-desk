import { Router } from 'express';
import mongoose from 'mongoose';
import Outward from '../models/Outward.js';
import Inward from '../models/Inward.js';
import Client from '../models/Client.js';
import { nextNumber } from '../models/Counter.js';
import { protect } from '../middleware/auth.js';
import { HttpError } from '../utils.js';

const router = Router();
router.use(protect);

// POST /api/outwards { client, givenTo, thirdPartyName, items: [{ inward, itemId }], note }
router.post('/', async (req, res) => {
  const { client, givenTo, thirdPartyName = '', items = [], note = '' } = req.body ?? {};

  if (!mongoose.isValidObjectId(client) || !(await Client.exists({ _id: client }))) {
    throw new HttpError(400, 'Choose the client');
  }
  if (!Array.isArray(items) || items.length === 0) throw new HttpError(400, 'Tick at least one document');
  if (!['CLIENT', 'THIRD_PARTY'].includes(givenTo)) throw new HttpError(400, 'Choose who the documents were given to');
  if (givenTo === 'THIRD_PARTY' && !thirdPartyName.trim()) {
    throw new HttpError(400, 'Type the name of the person who collected them');
  }

  // Every ticked document must belong to this client and still be with us
  const inwardIds = [...new Set(items.map((i) => String(i.inward)))];
  if (!inwardIds.every((id) => mongoose.isValidObjectId(id))) throw new HttpError(400, 'Invalid document');
  const inwards = await Inward.find({ _id: { $in: inwardIds }, client, isCancelled: false });

  const cleanItems = items.map((i) => {
    const inward = inwards.find((w) => w._id.equals(i.inward));
    const item = inward?.items.id(i.itemId);
    if (!item || item.returnedIn) {
      throw new HttpError(400, 'A ticked document is not with us any more. Refresh the page.');
    }
    return { inward: inward._id, inwardNumber: inward.number, itemId: item._id, docName: item.docName };
  });

  // Transaction: the Outward and all "returned" marks are saved together, or not at all
  const outward = await mongoose.connection.transaction(async (session) => {
    const [out] = await Outward.create(
      [{
        number: await nextNumber('OUT', session),
        client,
        givenTo,
        thirdPartyName: givenTo === 'THIRD_PARTY' ? thirdPartyName.trim() : '',
        items: cleanItems,
        givenBy: req.user._id,
        note,
      }],
      { session }
    );

    for (const it of cleanItems) {
      // Only matches if the item is STILL with us, so it blocks double returns
      const result = await Inward.updateOne(
        { _id: it.inward, items: { $elemMatch: { _id: it.itemId, returnedIn: null } } },
        { $set: { 'items.$.returnedIn': out._id, 'items.$.returnedAt': out.givenAt } },
        { session }
      );
      if (result.modifiedCount !== 1) {
        throw new HttpError(409, 'Someone just returned one of these documents. Refresh and try again.');
      }
    }
    return out;
  });

  res.status(201).json(outward);
});

export default router;