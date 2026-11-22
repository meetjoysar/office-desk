import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const outwardSchema = new mongoose.Schema(
  {
    number: { type: String, required: true, unique: true },
    client: { type: ObjectId, ref: 'Client', required: true },
    givenTo: { type: String, enum: ['CLIENT', 'THIRD_PARTY'], required: true },
    thirdPartyName: { type: String, trim: true, default: '' },
    items: [
      {
        inward: { type: ObjectId, ref: 'Inward' },
        inwardNumber: String,
        itemId: ObjectId,
        docName: String,
      },
    ],
    givenBy: { type: ObjectId, ref: 'User', required: true },
    givenAt: { type: Date, default: Date.now },
    note: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

export default mongoose.model('Outward', outwardSchema);