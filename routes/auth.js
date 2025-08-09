import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Mentor from '../models/Mentor.js'
import authenticate from '../middleware/authenticate.js';
import Admin from '../models/Admin.js';

const router = express.Router();



router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1️⃣ Admin check
    const admin = await Admin.findOne({ where: { email } });
    if (admin) {
      if (admin.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      const token = jwt.sign({ adminId: admin.adminId }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.json({ token, role: "admin" });
    }

    // 2️⃣ Student check
    const user = await User.findOne({ where: { email } });
    if (user) {
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      if (user.firstLogin) {
        return res.json({ firstLogin: true, role: "student", userId: user.UserId });
      }
      const token = jwt.sign({ userId: user.UserId }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.json({ token, role: "student" });
    }

    // 3️⃣ Mentor check
    const mentor = await Mentor.findOne({ where: { email } });
    if (mentor) {
      if (mentor.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (mentor.firstLogin) {
        return res.json({ firstLogin: true, role: "mentor", userId: mentor.mentorId });
      }
      const token = jwt.sign({ mentorId: mentor.mentorId }, process.env.JWT_SECRET, { expiresIn: "1h" });
      return res.json({ token, role: "mentor" });
    }

    return res.status(404).json({ message: "User not found" });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    // Admin check
    // const admin = await Admin.findByPk(userId);
    // if (admin) {
    //   admin.password = newPassword;
    //   await admin.save();
    //   return res.json({ message: "Password updated successfully", role: "admin" });
    // }

    // Student check
    const user = await User.findByPk(userId);
    if (user) {
      user.password = newPassword;
      user.firstLogin = false;
      await user.save();
      return res.json({ message: "Password updated successfully", role: "student" });
    }

    // Mentor check
    const mentor = await Mentor.findByPk(userId);
    if (mentor) {
      mentor.password = newPassword;
      mentor.firstLogin = false;
      await mentor.save();
      return res.json({ message: "Password updated successfully", role: "mentor" });
    }

    return res.status(404).json({ message: "User not found" });

  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: "Server error" });
  }
});





export default router;
