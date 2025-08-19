import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import Sib from 'sib-api-v3-sdk';
import { fileURLToPath } from 'url';
import { Router } from 'express';
// import { upload, uploadToSupabase } from "../middleware/upload.js";
import { uploadprofile } from "../config/cloud_profile.js"
import { uploadToBackblaze } from "../middleware/upload.js";

import User from '../models/User.js';
import Mentor from '../models/Mentor.js';
import Student from '../models/Student.js'
import TeamUpload from '../models/TeamUpload.js';
import authenticate from '../middleware/authenticate.js';
import { supabase } from "../config/cloudinary.js";
import multer from 'multer';
const storage = multer.memoryStorage();
const upload = multer({ storage });

dotenv.config();

const router = Router();

router.get("/dashboard", authenticate, async (req, res) => {
  try {
    console.log(req.user)
    const user = await User.findByPk(req.user.userId);
    const students = await Student.findAll({ where: { user_id: req.user.userId } });
    const mentor = await Mentor.findOne({ where: { mentorId: user.mentor_id } });

    res.json({
      teamName: user.team_name,
      profilePhoto:user.profilePhoto,
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


// router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     const fileName = file.originalname;
//     const mimeType = file.mimetype;

//     const supabaseUrl = await uploadToSupabase(file.buffer, fileName, mimeType);
//     const userId = req.user.UserId;
//     const weekNumber = req.body.week_number;

//     const user = await User.findByPk(userId);
//     const mentorId = user.mentor_id;
//     const mentor = await Mentor.findByPk(mentorId);

//     const [uploadEntry, created] = await TeamUpload.findOrCreate({
//       where: { user_id: userId, week_number: weekNumber },
//       defaults: {
//         file_url: supabaseUrl,
//         status: "SUBMITTED",
//         mentor_id: mentorId,
//       },
//     });

//     if (!created) {
//       uploadEntry.file_url = supabaseUrl;
//       uploadEntry.uploaded_at = new Date();
//       uploadEntry.status = "SUBMITTED";
//       uploadEntry.mentor_id = mentorId;
//       await uploadEntry.save();
//     }

//     // Send email with Brevo (Sendinblue)
//     const client = Sib.ApiClient.instance;
//     const apiKey = client.authentications["api-key"];
//     apiKey.apiKey = process.env.EMAIL_PASSWORD;

//     const transEmailApi = new Sib.TransactionalEmailsApi();
//     const sender = {
//       email: process.env.EMAIL_USER,
//       name: "IPD-TEAM",
//     };
// //[{ email: mentor.email }]
// // console.log(mentor.email)
//     await transEmailApi.sendTransacEmail({
//   sender,
//   to: [{ email: "balajiaru06@gmail.com" }],
//   subject: `Team Upload Notification - Week ${weekNumber}`,
//   htmlContent: `<h3>Dear ${mentor.name},</h3>
//     <p>Your mentee has uploaded a file for <strong>Week ${weekNumber}</strong>.</p>
//     <p>You can view or download the file using the attachment or from the dashboard.</p>
//     <p><a href="https://ipd-portal.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
//     <p><a href="${supabaseUrl}" target="_blank">${fileName}</a></p>
//     <p>Team Name: <strong>${user.team_name}</strong></p>
//     <br />
//     <p>Best Regards,<br />IPD Team</p>`,
//   attachment: [
//     {
//       url: supabaseUrl,
//       name: fileName,
//     },
//   ],
// });


//     res.status(200).json({ message: "Upload successful", url: supabaseUrl });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });



// router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
//   try {
//     const file = req.file;
//     const fileName = file.originalname;
//     const mimeType = file.mimetype;

//     const supabaseUrl = await uploadToSupabase(file.buffer, fileName, mimeType);
//     const userId = req.user.userId;
//     const weekNumber = req.body.week_number;

//     const user = await User.findByPk(userId);
//     const mentorId = user.mentor_id;
//     const mentor = await Mentor.findByPk(mentorId);

//     const [uploadEntry, created] = await TeamUpload.findOrCreate({
//       where: { user_id: userId, week_number: weekNumber },
//       defaults: {
//         file_url: supabaseUrl,
//         status: "SUBMITTED",
//         mentor_id: mentorId,
//       },
//     });

//     if (!created) {
//       uploadEntry.file_url = supabaseUrl;
//       uploadEntry.uploaded_at = new Date();
//       uploadEntry.status = "SUBMITTED";
//       uploadEntry.mentor_id = mentorId;
//       await uploadEntry.save();
//     }

//     // Send email with Brevo (Sendinblue)
    // const client = Sib.ApiClient.instance;
    // const apiKey = client.authentications["api-key"];
    // apiKey.apiKey = process.env.EMAIL_PASSWORD;

    // const transEmailApi = new Sib.TransactionalEmailsApi();
    // const sender = {
    //   email: process.env.EMAIL_USER,
    //   name: "IPD-TEAM",
    // };
// //[{ email: mentor.email }]
// // console.log(mentor.email)
//     await transEmailApi.sendTransacEmail({
//   sender,
//   to: [{ email: "balajiaru06@gmail.com" }],
//   subject: `Team Upload Notification - Week ${weekNumber}`,
//   htmlContent: `<h3>Hello ${mentor.title}${mentor.name},</h3>
//     <p>Your mentee has uploaded a file for <strong>Week ${weekNumber}</strong>.</p>
//     <p>You can view or download the file using the attachment or from the dashboard.</p>
//     <p><a href="https://ipd-portal.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
//     <p><a href="${supabaseUrl}" target="_blank">${fileName}</a></p>
//     <p>Team Name: <strong>${user.team_name}</strong></p>
//     <p>Contact No: <strong>${user.mobile}</strong></p>
//     <br />
//     <p>Best Regards,<br />IPD Team</p>`,
//   attachment: [
//     {
//       url: supabaseUrl,
//       name: fileName,
//     },
//   ],
// });


//     res.status(200).json({ message: "Upload successful", url: supabaseUrl });
//   } catch (err) {
//     console.error("Upload error:", err);
//     res.status(500).json({ message: "Upload failed", error: err.message });
//   }
// });



router.post("/upload", authenticate, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const fileName = file.originalname;
    const mimeType = file.mimetype;

    const fileUrl = await uploadToBackblaze(file.buffer, fileName, mimeType);
    const userId = req.user.userId;
    const weekNumber = req.body.week_number;

    const user = await User.findByPk(userId);
    const mentorId = user.mentor_id;
    const mentor = await Mentor.findByPk(mentorId);

    const [uploadEntry, created] = await TeamUpload.findOrCreate({
      where: { user_id: userId, week_number: weekNumber },
      defaults: {
        file_url: fileUrl,
        status: "SUBMITTED",
        mentor_id: mentorId,
      },
    });

    if (!created) {
      uploadEntry.file_url = fileUrl;
      uploadEntry.uploaded_at = new Date();
      uploadEntry.status = "SUBMITTED";
      uploadEntry.mentor_id = mentorId;
      await uploadEntry.save();
    }

        const client = Sib.ApiClient.instance;
    const apiKey = client.authentications["api-key"];
    apiKey.apiKey = process.env.EMAIL_PASSWORD;

    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: process.env.EMAIL_USER,
      name: "IPD-TEAM",
    };

    // Email notification (unchanged, just replaced supabaseUrl with fileUrl)
    await transEmailApi.sendTransacEmail({
      sender,
      to: [{ email: mentor.email }],
      subject: `Team Upload Notification - Week ${weekNumber}`,
      htmlContent: `<h3>Hello ${mentor.title}${mentor.name},</h3>
        <p>Your mentee has uploaded a file for <strong>Week ${weekNumber}</strong>.</p>
        <p>You can view or download the file using the attachment or from the dashboard.</p>
        <p><a href="https://agni-ipd.onrender.com/" target="_blank">IPD Dashboard Link</a></p>
        <p><a href="${fileUrl}" target="_blank">${fileName}</a></p>
        <p>Team Name: <strong>${user.team_name}</strong></p>
        <p>Contact No: <strong>${user.mobile}</strong></p>
        <p>Best Regards,<br />IPD Team</p>`,
      attachment: [
        {
          url: fileUrl,
          name: fileName,
        },
      ],
    });

    res.status(200).json({ message: "Upload successful", url: fileUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed", error: err.message });
  }
});




router.get("/upload-history", authenticate, async (req, res) => {
  try {
    const uploads = await TeamUpload.findAll({
      where: { user_id: req.user.userId },
      order: [["week_number", "ASC"]],
    });

    res.json(uploads);
  } catch (err) {
    console.error("Upload fetch error:", err);
    res.status(500).json({ error: "Server Error" });
  }
});

// router.put('/profile', authenticate, async (req, res) => {
//   try {
//     const userId = req.user.UserId; // from decoded token
//     const { mobile } = req.body;

//     if (!mobile || mobile.length < 10 || mobile.length>10) {
//       return res.status(400).json({ message: "Invalid mobile number" });
//     }

//     await User.update({ mobile }, { where: { UserId: userId } });

//     return res.json({ message: 'Mobile number updated successfully' });
//   } catch (err) {
//     console.error("Error updating profile:", err);
//     res.status(500).json({ message: 'Server error' });
//   }
// });

// PUT /profile - Update mobile numbers
router.put('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { mobile, studentMobiles = [] } = req.body;

    // Validate team leader mobile
    if (!mobile || mobile.length !== 10) {
      return res.status(400).json({ message: "Invalid team leader mobile number" });
    }

    await User.update({ mobile }, { where: { UserId: userId } });

    for (const student of studentMobiles) {
      if (!student.id || !student.mobile || student.mobile.length !== 10) {
        return res.status(400).json({ message: "Invalid student mobile input" });
      }

      await Student.update(
        { mobile: student.mobile },
        { where: { id: student.id, user_id: userId } } // Prevent tampering
      );
    }

    return res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post("/upload-profile-photo", authenticate, uploadprofile.single("photo"), async (req, res) => {
  console.log(req.file)
  try {
    const file = req.file;
    const photoUrl = file.path; // Cloudinary URL
    const userId = req.user.userId;

    // Update photo URL in the user table
   await User.update(
        { profilePhoto: photoUrl },
        { where: { UserId: userId } }
      );


    res.json({ photoUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ message: "Upload failed" });
  }
});



export default router;
