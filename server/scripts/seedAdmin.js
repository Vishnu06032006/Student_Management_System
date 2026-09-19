require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const { hashPassword, PASSWORD_POLICY_REGEX } = require('../utils/password');

async function seedAdmin() {
  const loginId = process.env.ADMIN_LOGIN_ID;
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!loginId || !email || !password) {
    throw new Error('Set ADMIN_LOGIN_ID, ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding');
  }
  if (!PASSWORD_POLICY_REGEX.test(password)) {
    throw new Error(
      'ADMIN_PASSWORD must be at least 8 characters and include uppercase, lowercase, a number, and a special character'
    );
  }

  await connectDB();

  const existingAdmin = await User.findOne({ role: 'ADMIN' });
  if (existingAdmin) {
    console.log(`An admin account already exists (${existingAdmin.loginId}). Skipping seed.`);
    return;
  }

  const passwordHash = await hashPassword(password);
  const admin = await User.create({
    loginId: loginId.trim().toUpperCase(),
    email: email.trim().toLowerCase(),
    passwordHash,
    role: 'ADMIN',
    status: 'ENABLED',
    mustChangePassword: true,
  });

  console.log(`Admin account created: ${admin.loginId} (${admin.email})`);
  console.log('mustChangePassword is true — log in with the seeded password and set a new one immediately.');
}

seedAdmin()
  .catch((err) => {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.connection.close());
