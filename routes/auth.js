import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import authenticate from '../middleware/authenticate.js';

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log(email, password);
    const user = await User.findOne({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.password !== password)
      return res.status(401).json({ message: "Invalid credentials" });

    if (user.firstLogin) {
      return res.status(200).json({ firstLogin: true, userId: user.UserId });
    }

    const token = jwt.sign({ UserId: user.UserId }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/reset-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    console.log(userId);
    const user = await User.findByPk(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    user.password = newPassword;
    user.firstLogin = false;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password reset error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id; // from decoded token
    const { mobile } = req.body;

    if (!mobile || mobile.length < 10) {
      return res.status(400).json({ message: "Invalid mobile number" });
    }

    await User.update({ mobile }, { where: { id: userId } });

    return res.json({ message: 'Mobile number updated successfully' });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
