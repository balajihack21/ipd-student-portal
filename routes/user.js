const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Student = require("../models/Student");
const Mentor = require('../models/Mentor')
const authenticate = require("../middleware/authenticate"); // middleware to verify JWT
const upload = require("../middleware/upload");
const TeamUpload = require("../models/TeamUpload");
// const transporter = require('../config/sendEmail');

router.get("/dashboard", authenticate, async (req, res) => {
  try {
    console.log(req.user)
    const user = await User.findByPk(req.user.UserId);
    const students = await Student.findAll({ where: { user_id: req.user.UserId } });
    console.log(user.mentor_id)
    const mentor = await Mentor.findOne({ where: { mentorId: user.mentor_id } })
    console.log(mentor)


    res.json({
      teamName: user.team_name,
      mobile: user.mobile,
      students,
      mentor
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Update profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { team_name, mobile } = req.body;
    await User.update(
      { team_name, mobile },
      { where: { UserId: req.user.UserId } }
    );
    res.json({ message: "Profile updated." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error." });
  }
});




router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    console.log(req.file)
    const fileUrl = req.file.path;
    const userId = req.user.UserId;
    const weekNumber = req.body.week_number;
    console.log(fileUrl, userId, weekNumber)
    const user = await User.findByPk(userId);
    const mentorId = user.mentor_id;
    const mentor = await Mentor.findByPk(mentorId);

    const [uploadEntry, created] = await TeamUpload.findOrCreate({
      where: { user_id: userId, week_number: weekNumber },
      defaults: {
        file_url: fileUrl,
        status: "SUBMITTED",
        mentor_id: mentorId
      },
    });
    console.log(created)

    if (!created) {
      uploadEntry.file_url = fileUrl;
      uploadEntry.uploaded_at = new Date();
      uploadEntry.status = "SUBMITTED";
      uploadEntry.mentor_id = mentorId;
      await uploadEntry.save();
    }

    // if (mentorId == mentor.id) {
    //   console.log("matched")
    //   const mentor = user.Mentor;



    //   await transporter.sendMail({
    //     from: '"Team Upload" <your_email@domain.com>',
    //     to: mentor.email,
    //     subject: `New Upload from ${user.teamName}`,
    //     text: `The team has uploaded their Week ${uploadEntry.week_number} file.\nLink: ${uploadEntry.file_url}`,
    //     html: `<p>The team has uploaded their <strong>Week ${uploadEntry.week_number}</strong> file.</p><p><a href="${uploadEntry.file_url}">Click to view</a></p>`,
    //   });

    // }

    res.status(200).json({ message: "Upload successful", url: fileUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});

router.get("/upload-history", authenticate, async (req, res) => {
  try {
    const uploads = await TeamUpload.findAll({
      where: { user_id: req.user.UserId },
      order: [['week_number', 'ASC']]
    });

    res.json(uploads);
  } catch (err) {
    console.error("Upload fetch error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});


module.exports = router;
