import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.model';

dotenv.config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI!);
  await User.deleteMany({});
  await User.create({
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
  });
  console.log('Admin user seeded');
  process.exit(0);
}

seed().catch(console.error);