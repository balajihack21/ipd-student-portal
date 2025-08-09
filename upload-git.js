// seedAdmin.js
import sequelize from './models/index.js';
import Admin from './models/Admin.js';
import jwt from 'jsonwebtoken';

async function seedAdmin() {
  await sequelize.sync(); // Make sure DB & table exist

  const email = "head.ipd@act.edu.in";
  const password = "admin2025"; // plain here, recommend bcrypt in production

  const existingAdmin = await Admin.findOne({ where: { email } });
  if (existingAdmin) {
    console.log("✅ Admin already exists.");
    return;
  }

  // Generate a token for admin
  const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
    expiresIn: "1h"
  });

  await Admin.create({
    email,
    password,
    token
  });

  console.log("✅ Admin created successfully with token:", token);
}

seedAdmin().then(() => process.exit());
