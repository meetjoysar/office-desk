import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import User from './models/User.js';

await connectDB();
await User.deleteMany({}); // wipes users — only for development!

const pinHash = await bcrypt.hash('2468', 10);

await User.insertMany([
  { fullName: 'Anil Shah',  shortName: 'Anil',   role: 'BOSS',  pinHash },
  { fullName: 'Meena Shah', shortName: 'Meena',  role: 'BOSS',  pinHash },
  { fullName: 'Ramesh Patil', shortName: 'Ramesh', role: 'STAFF', pinHash },
  { fullName: 'Priya Joshi',  shortName: 'Priya',  role: 'STAFF', pinHash },
  { fullName: 'Suresh Rao',   shortName: 'Suresh', role: 'STAFF', pinHash },
]);

console.log('Seeded 5 users. PIN for everyone: 2468');
await mongoose.disconnect();