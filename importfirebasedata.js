// Add at the top if needed
const fs = require('fs');
const path = require('path');
const sequelize = require('./models/index');
const User = require('./models/User');
const Student = require('./models/Student');
const jwt = require('jsonwebtoken');
require('dotenv').config(); // If using .env
const Mentor = require('./models/Mentor');

async function importFirebaseData() {
  const jsonPath = path.join(__dirname, 'firebase_export.json');
  const rawData = fs.readFileSync(jsonPath);
  const teams = JSON.parse(rawData);

  try {
    // ⚠️ Disable foreign key checks and drop all tables safely
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('DROP TABLE IF EXISTS team_uploads');
    // await sequelize.query('DROP TABLE IF EXISTS students');
    await sequelize.query('DROP TABLE IF EXISTS users');
    // await sequelize.query('DROP TABLE IF EXISTS mentors');
    // await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // ✅ Recreate all tables
    await sequelize.sync({ force: true });
    console.log('🗑️ All tables dropped and recreated.');

    // 🔹 Insert one mentor (you can customize as needed)
    // const mentor = await Mentor.create({
    //   name: 'Revathi',
    //   email: 'revathi@act.edu.in',
    //   department: 'CSE',
    //   mobile: '9876543210'
    // });
    // console.log(`👨‍🏫 Mentor created with ID ${mentor.id}`);

    // 🚀 Insert team data
    let idx = 1;
    for (const team of teams) {
      const { teamName, email, mobile, teamLeader, students, mentor } = team;

  const userId = "24ipd" + String(idx++).padStart(2, "0");
      // 1. Create user and assign mentor_id
      const user = await User.create({
        UserId: userId,
        team_name: teamName,
        email,
        mobile,
        token: "",
        mentor_id: mentor.mentorId,
        password: mobile // use dynamically created mentor
      });
      const token = jwt.sign({ UserId: user.UserId }, process.env.JWT_SECRET, {
        expiresIn: '1d'
      });
      await user.update({ token });

      // 2. Add team leader
      await Student.create({
        register_no: teamLeader.RegisterNo,
        student_name: teamLeader.StudentName,
        dept: teamLeader.Dept,
        section: teamLeader.Section,
        is_leader: true,
        user_id: user.UserId
      });

      // 3. Add other members
      for (const student of students) {
        await Student.create({
          register_no: student.RegisterNo,
          student_name: student.StudentName,
          dept: student.Dept,
          section: student.Section,
          is_leader: false,
          user_id: user.UserId
        });
      }

      console.log(`✅ Imported team: ${teamName} with JWT`);
    }

    console.log("🎉 All data imported successfully.");
  } catch (err) {
    console.error("❌ Import failed:", err);
  } finally {
    await sequelize.close();
  }
}

importFirebaseData();
