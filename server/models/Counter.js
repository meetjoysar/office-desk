import mongoose from 'mongoose';

const counterSchema = new mongoose.Schema({
  _id: String,                 // 'IN' or 'OUT'
  seq: { type: Number, default: 0 },
});

const Counter = mongoose.model('Counter', counterSchema);

// $inc is atomic, so two people saving at once can never get the same number
export async function nextNumber(name, session) {
  const c = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', session }
  );
  return `${name}-${String(c.seq).padStart(4, '0')}`; // IN-0001
}

export default Counter;