import mongoose from 'mongoose';

const typeSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['DOC', 'TASK'], required: true }, // DOC = document type, TASK = work type
    name: { type: String, required: [true, 'Enter a name'], trim: true, maxlength: 60 },
    order: { type: Number, default: 0 },
    isOther: { type: Boolean, default: false }, // the locked "Other…" item, always last
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

typeSchema.index({ kind: 1, name: 1 }, { unique: true }); // no duplicate names within a kind

export default mongoose.model('Type', typeSchema);