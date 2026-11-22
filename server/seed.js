import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Client from './models/Client.js';
import Type from './models/Type.js';
import Office from './models/Office.js';
import Counter from './models/Counter.js';
import Inward from './models/Inward.js';
import Outward from './models/Outward.js';
import Task from './models/Task.js';
import { todayStr, addDays } from './utils.js';

await connectDB();
await User.deleteMany({});
await Client.deleteMany({});
await Type.deleteMany({});
await Office.deleteMany({});
await Counter.deleteMany({});
await Inward.deleteMany({});
await Outward.deleteMany({});
await Task.deleteMany({});

const pinHash = await bcrypt.hash('2468', 10);

const [anil, meena, ramesh, priya, suresh] = await User.insertMany([
  { fullName: 'Anil Shah', shortName: 'Anil', role: 'BOSS', pinHash },
  { fullName: 'Meena Shah', shortName: 'Meena', role: 'BOSS', pinHash },
  { fullName: 'Ramesh Patil', shortName: 'Ramesh', role: 'STAFF', pinHash },
  { fullName: 'Priya Joshi', shortName: 'Priya', role: 'STAFF', pinHash },
  { fullName: 'Suresh Rao', shortName: 'Suresh', role: 'STAFF', pinHash },
]);

const by = anil._id;
const clients = await Client.insertMany([
  { name: 'Patel Traders', clientType: 'FIRM', mobile: '9644100441', usualStaff: ramesh._id, createdBy: by },
  { name: 'Sharma & Sons', clientType: 'HUF', mobile: '9731800318', usualStaff: priya._id, createdBy: by },
  { name: 'Joshi Textiles', clientType: 'FIRM', mobile: '9783000830', usualStaff: meena._id, createdBy: by },
  { name: 'Kulkarni Hospital', clientType: 'TRUST', mobile: '9910200102', usualStaff: ramesh._id, createdBy: by },
  { name: 'Desai Builders', clientType: 'COMPANY', mobile: '9821400214', usualStaff: ramesh._id, createdBy: by },
  { name: 'Mehta Clinic', clientType: 'INDIVIDUAL', mobile: '9857700577', usualStaff: priya._id, createdBy: by },
  { name: 'Rao Enterprises', clientType: 'COMPANY', mobile: '9890600906', usualStaff: suresh._id, createdBy: by },
]);

const DOCS = ['PAN Card', 'Aadhaar Card', 'Bank Statement', 'Form 16', 'Previous ITR', 'GST Certificate',
  'Sale / Purchase Bills', 'Sale Deed', 'Property Tax Bill', 'Partnership Deed', 'Cancelled Cheque'];
const WORK = ['GST Return', 'Income Tax Return', 'TDS Return', 'Audit', 'Balance Sheet',
  'Accounting Entries', 'ROC Filing', 'PAN / Aadhaar Work'];

const toTypes = (kind, names) => [
  ...names.map((name, i) => ({ kind, name, order: i })),
  { kind, name: 'Other…', order: names.length, isOther: true },
];
await Type.insertMany([...toTypes('DOC', DOCS), ...toTypes('TASK', WORK)]);

await Office.insertMany([
  { name: 'Office 1', cupboards: 6, rowsPerCupboard: 4 },
  { name: 'Office 2', cupboards: 5, rowsPerCupboard: 5 },
]);

const work = await Type.find({ kind: 'TASK', isOther: false }).sort({ order: 1 });
const today = todayStr();

// task(work index, client index, assigned to, assigned by, due in N days, status)
const task = (w, c, to, by, dueIn, status = 'TODO') => ({
  client: clients[c]._id,
  taskType: work[w]._id,
  workName: work[w].name,
  assignedTo: to._id,
  assignedBy: by._id,
  dueDate: addDays(today, dueIn),
  status,
  startedAt: status === 'TODO' ? null : new Date(),
  doneAt: status === 'DONE' ? new Date() : null,
});

await Task.insertMany([
  task(0, 0, ramesh, anil, -2),                 // overdue
  task(1, 1, ramesh, anil, 0, 'IN_PROGRESS'),   // due today
  task(2, 3, ramesh, meena, 1),                 // due tomorrow
  task(3, 2, ramesh, meena, 3),
  task(4, 4, ramesh, ramesh, 6),                // Ramesh's own task
  task(0, 5, priya, anil, -4),
  task(5, 1, priya, anil, 2, 'IN_PROGRESS'),
  task(1, 6, suresh, meena, -1),
  task(6, 4, suresh, anil, 5),
  task(7, 0, priya, meena, -3, 'DONE'),
]);

console.log('Seeded users (PIN 2468), clients, types and offices');
await mongoose.disconnect();