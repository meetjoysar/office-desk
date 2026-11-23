import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const notificationSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    task: { type: ObjectId, ref: 'Task', default: null },
    kind: {
      type: String,
      enum: ['ASSIGNED', 'DUE_REMINDER', 'OVERDUE', 'OVERDUE_FOR_BOSS'],
      required: true,
    },
    message: { type: String, required: true },
    dedupeKey: { type: String, required: true, unique: true }, // stops duplicates
    readAt: { type: Date, default: null },
    emailedAt: { type: Date, default: null },
    emailError: { type: String, default: '' },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);