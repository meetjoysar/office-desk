import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Enter the client name'], trim: true, maxlength: 150 },
    clientType: {
      type: String,
      enum: ['INDIVIDUAL', 'FIRM', 'COMPANY', 'HUF', 'TRUST'],
      default: 'INDIVIDUAL',
    },
    mobile: { type: String, trim: true, match: [/^\d{10}$/, 'Mobile must be 10 digits'] },
    email: { type: String, trim: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Email looks wrong'] },
    usualStaff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true }, // false = hidden, never deleted
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

clientSchema.index({ name: 1 });

export default mongoose.model('Client', clientSchema);