const fs = require('fs');
const path = require('path');
// const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const sequelize = require('./models/index');
const Mentor = require('./models/Mentor');

async function importMentorsData() {
  const jsonPath = path.join(__dirname, 'mentor_export.json'); // Update path if needed
  const rawData = fs.readFileSync(jsonPath);
  const mentors = JSON.parse(rawData);

  try {
    // // 🔄 Drop mentors table only
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    await sequelize.query('DROP TABLE IF EXISTS mentors');
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // 🔁 Recreate mentors table only
    await Mentor.sync({ force: true });
    console.log('✅ Mentor table recreated');

    for (const m of mentors) {
      const token = jwt.sign({ email: m.Mail }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });

    //   const hashedPassword = await bcrypt.hash('default123', 10);

      await Mentor.create({
        mentorId: m.Id,
        title: m.Title,
        name: m.Name,
        email: m.Mail,
        department: m.Department,
        designation: m.Designation,
        password: "default123",
        token: token,
      });

      console.log(`🧑‍🏫 Imported: ${m.Name}`);
    }

    console.log('🎉 All mentors imported successfully!');
  } catch (err) {
    console.error('❌ Import failed:', err);
  } finally {
    await sequelize.close();
  }
}

importMentorsData();
