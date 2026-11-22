import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    fullName:  { type: String, required: true, trim: true },
    shortName: { type: String, required: true, trim: true },
    role:      { type: String, enum: ['BOSS', 'STAFF'], default: 'STAFF' },
    pinHash:   { type: String, required: true },
    email:     { type: String, trim: true, lowercase: true },
    mobile:    { type: String },
    isActive:  { type: Boolean, default: true },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

export default mongoose.model('User', userSchema);