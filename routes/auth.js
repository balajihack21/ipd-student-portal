const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log(email, password)
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
    // res.status(200).json({message:"Logged in Successfully"})
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/reset-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    console.log(userId)
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

module.exports = router;
