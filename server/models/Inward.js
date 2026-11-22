import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

// One document inside an Inward entry (embedded)
const itemSchema = new mongoose.Schema({
  docType: { type: ObjectId, ref: 'Type', required: true },
  docName: { type: String, required: true },   // "PAN Card" or the "Other" text
  copyKind: { type: String, enum: ['HARD', 'SOFT'], default: 'HARD' },
  originalKind: { type: String, enum: ['ORIGINAL', 'XEROX'], default: 'XEROX' },
  returnedIn: { type: ObjectId, ref: 'Outward', default: null }, // null = still with us
  returnedAt: { type: Date, default: null },
});

const inwardSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    client: { type: ObjectId, ref: 'Client', required: true },
    source: { type: String, enum: ['DIRECT', 'THIRD_PARTY'], required: true },
    thirdPartyName: { type: String, trim: true, default: '' },
    place: {
      office: { type: ObjectId, ref: 'Office', required: true },
      officeName: String,
      cupboard: Number,
      row: Number,
    },
    items: [itemSchema],
    receivedBy: { type: ObjectId, ref: 'User', required: true },
    receivedAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: '' },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

inwardSchema.index({ client: 1, receivedAt: -1 });

export default mongoose.model('Inward', inwardSchema);