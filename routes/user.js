import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';
import { fileURLToPath } from 'url';
import { Router } from 'express';
import { upload, uploadToSupabase } from "../middleware/upload.js";

import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js'
import TeamUpload from '../models/TeamUpload.js';
import authenticate from '../middleware/authenticate.js';
import { supabase } from "../config/cloudinary.js";

dotenv.config();

const router = Router();

router.get("/dashboard", authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.UserId);
    const students = await Student.findAll({ where: { user_id: req.user.UserId } });
    const mentor = await Mentor.findOne({ where: { mentorId: user.mentor_id } });

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

// router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
//   try {
//     const filePath = req.file.path; // Cloudinary URL
//     const fileName = path.basename(filePath);
//     const userId = req.user.UserId;
//     const weekNumber = req.body.week_number;

//     console.log("filePath:", filePath);
//     console.log("userId:", userId);
//     console.log("weekNumber:", weekNumber);

//     const user = await User.findByPk(userId);
//     const mentorId = user.mentor_id;
//     const mentor = await Mentor.findByPk(mentorId);

//     const [uploadEntry, created] = await TeamUpload.findOrCreate({
//       where: { user_id: userId, week_number: weekNumber },
//       defaults: {
//         file_url: filePath,
//         status: "SUBMITTED",
//         mentor_id: mentorId,
//       },
//     });

//     console.log("Upload entry created:", created);

//     if (!created) {
//       uploadEntry.file_url = filePath;
//       uploadEntry.uploaded_at = new Date();
//       uploadEntry.status = "SUBMITTED";
//       uploadEntry.mentor_id = mentorId;
//       await uploadEntry.save();
//     }

//     // Setup Brevo (Sendinblue) API
//     const client = Sib.ApiClient.instance;
//     const apiKey = client.authentications["api-key"];
//     apiKey.apiKey = process.env.EMAIL_PASSWORD;

//     const transEmailApi = new Sib.TransactionalEmailsApi();
//     const sender = {
//       email: process.env.EMAIL_USER,
//       name: "IPD-TEAM",
//     };
// //  to: [{ email: mentor.email }],
//     const emailResponse = await transEmailApi.sendTransacEmail({
//       sender,
//       to:[{email:"balajiaru06@gmail.com"}],
//       subject: `Team Upload Notification - Week ${weekNumber}`,
//       textContent: `A file has been uploaded by your mentee (Team Name: ${user.team_name}) for week ${weekNumber}.`,
//       htmlContent: `<h3>Dear ${mentor.name},</h3>
//         <p>Your mentee has uploaded a file for <strong>Week ${weekNumber}</strong>.</p>
//         <p>You can view or download the file using the attachment or from the dashboard.</p>
//         <p>Team Name: <strong>${user.team_name}</strong></p>
//         <br />
//         <p>Best Regards,<br />IPD Team</p>`,
//       attachment: [
//         {
//           url: filePath,
//           name: fileName,
//         },
//       ],
//     });

//     console.log("Email sent successfully");

//     res.status(200).json({ message: "Upload successful", url: filePath });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });

// routes/upload.js


router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const fileName = file.originalname;
    const mimeType = file.mimetype;

    const supabaseUrl = await uploadToSupabase(file.buffer, fileName, mimeType);
    const userId = req.user.UserId;
    const weekNumber = req.body.week_number;

    const user = await User.findByPk(userId);
    const mentorId = user.mentor_id;
    const mentor = await Mentor.findByPk(mentorId);

    const [uploadEntry, created] = await TeamUpload.findOrCreate({
      where: { user_id: userId, week_number: weekNumber },
      defaults: {
        file_url: supabaseUrl,
        status: "SUBMITTED",
        mentor_id: mentorId,
      },
    });

    if (!created) {
      uploadEntry.file_url = supabaseUrl;
      uploadEntry.uploaded_at = new Date();
      uploadEntry.status = "SUBMITTED";
      uploadEntry.mentor_id = mentorId;
      await uploadEntry.save();
    }

    // Send email with Brevo (Sendinblue)
    const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: process.env.EMAIL_USER,
      name: "IPD-TEAM",
    };
//[{ email: mentor.email }]
    await transEmailApi.sendTransacEmail({
  sender,
  to: [{ email: "balajiaru06@gmail.com" }],
  subject: `Team Upload Notification - Week ${weekNumber}`,
  htmlContent: `<h3>Dear ${mentor.name},</h3>
    <p>Your mentee has uploaded a file for <strong>Week ${weekNumber}</strong>.</p>
    <p>You can view or download the file using the attachment or from the dashboard.</p>
    <p><a href="${supabaseUrl}" target="_blank">${fileName}</a></p>
    <p>Team Name: <strong>${user.team_name}</strong></p>
    <br />
    <p>Best Regards,<br />IPD Team</p>`,
  attachment: [
    {
      url: supabaseUrl,
      name: fileName,
    },
  ],
});


    res.status(200).json({ message: "Upload successful", url: supabaseUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});


router.get("/upload-history", authenticate, async (req, res) => {
  try {
    const uploads = await TeamUpload.findAll({
      where: { user_id: req.user.UserId },
      order: [["week_number", "ASC"]],
    });

    res.json(uploads);
  } catch (err) {
    console.error("Upload fetch error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

export default router;
