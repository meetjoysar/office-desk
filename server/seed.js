import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';
import Client from './models/Client.js';

await connectDB();
await User.deleteMany({});
await Client.deleteMany({});

const pinHash = await bcrypt.hash('2468', 10);

const [anil, meena, ramesh, priya, suresh] = await User.insertMany([
  { fullName: 'Anil Shah',    shortName: 'Anil',   role: 'BOSS',  pinHash },
  { fullName: 'Meena Shah',   shortName: 'Meena',  role: 'BOSS',  pinHash },
  { fullName: 'Ramesh Patil', shortName: 'Ramesh', role: 'STAFF', pinHash },
  { fullName: 'Priya Joshi',  shortName: 'Priya',  role: 'STAFF', pinHash },
  { fullName: 'Suresh Rao',   shortName: 'Suresh', role: 'STAFF', pinHash },
]);

const by = anil._id;
await Client.insertMany([
  { name: 'Patel Traders',     clientType: 'FIRM',       mobile: '9644100441', usualStaff: ramesh._id, createdBy: by },
  { name: 'Sharma & Sons',     clientType: 'HUF',        mobile: '9731800318', usualStaff: priya._id,  createdBy: by },
  { name: 'Joshi Textiles',    clientType: 'FIRM',       mobile: '9783000830', usualStaff: meena._id,  createdBy: by },
  { name: 'Kulkarni Hospital', clientType: 'TRUST',      mobile: '9910200102', usualStaff: ramesh._id, createdBy: by },
  { name: 'Desai Builders',    clientType: 'COMPANY',    mobile: '9821400214', usualStaff: ramesh._id, createdBy: by },
  { name: 'Mehta Clinic',      clientType: 'INDIVIDUAL', mobile: '9857700577', usualStaff: priya._id,  createdBy: by },
  { name: 'Rao Enterprises',   clientType: 'COMPANY',    mobile: '9890600906', usualStaff: suresh._id, createdBy: by },
]);

console.log('Seeded 5 users (PIN 2468) and 7 clients');
await mongoose.disconnect();