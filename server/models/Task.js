import mongoose from 'mongoose';
const { ObjectId } = mongoose.Schema.Types;

const taskSchema = new mongoose.Schema(
  {
    client: { type: ObjectId, ref: 'Client', required: true },
    taskType: { type: ObjectId, ref: 'Type', required: true },
    workName: { type: String, required: true }, // "GST Return" or the "Other" text
    assignedTo: { type: ObjectId, ref: 'User', required: true },
    assignedBy: { type: ObjectId, ref: 'User', required: true },
    dueDate: { type: String, required: true }, // 'YYYY-MM-DD'
    status: { type: String, enum: ['TODO', 'IN_PROGRESS', 'DONE'], default: 'TODO' },
    startedAt: { type: Date, default: null },
    doneAt: { type: Date, default: null },
    note: { type: String, trim: true, default: '' },
    reminderDays: { type: [Number], default: [0, 1, 3] }, // days before the due date
    emailReminders: { type: Boolean, default: true },
    notifyBossIfOverdue: { type: Boolean, default: true },
    isCancelled: { type: Boolean, default: false },
  },
  { timestamps: true }
);

taskSchema.index({ assignedTo: 1, status: 1, dueDate: 1 });

export default mongoose.model('Task', taskSchema);