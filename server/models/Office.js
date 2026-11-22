import mongoose from 'mongoose';

const officeSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Enter the office name'], trim: true, unique: true },
    cupboards: { type: Number, default: 1, min: [1, 'At least 1 cupboard'], max: [30, 'At most 30 cupboards'] },
    rowsPerCupboard: { type: Number, default: 4, min: [1, 'At least 1 row'], max: [20, 'At most 20 rows'] },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model('Office', officeSchema);