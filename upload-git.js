// // seedAdmin.js
// import sequelize from './models/index.js';
// import Admin from './models/Admin.js';
// import jwt from 'jsonwebtoken';

// async function seedAdmin() {
//   await sequelize.sync(); // Make sure DB & table exist

//   const email = "head.ipd@act.edu.in";
//   const password = "admin2025"; // plain here, recommend bcrypt in production

//   const existingAdmin = await Admin.findOne({ where: { email } });
//   if (existingAdmin) {
//     console.log("✅ Admin already exists.");
//     return;
//   }

//   // Generate a token for admin
//   const token = jwt.sign({ email, role: "admin" }, process.env.JWT_SECRET, {
//     expiresIn: "1h"
//   });

//   await Admin.create({
//     email,
//     password,
//     token
//   });

//   console.log("✅ Admin created successfully with token:", token);
// }

// seedAdmin().then(() => process.exit());



// // // addCoordinatorColumn.js
// // import sequelize from './models/index.js';

// // async function addCoordinatorColumn() {
// //   try {
// //     // Add column if it doesn't exist
// //     await sequelize.query(`
// //       ALTER TABLE mentors
// //       ADD COLUMN IF NOT EXISTS is_coordinator TINYINT(1) DEFAULT 0
// //     `);

// //     console.log("✅ is_coordinator column added (or already exists).");
// //   } catch (error) {
// //     console.error("❌ Error adding column:", error);
// //   } finally {
// //     process.exit();
// //   }
// // }

// // addCoordinatorColumn();

// // import Admin from './models/Admin.js';
// // import sequelize from './models/index.js';

// // (async () => {
// //   try {
// //     // Drop only the Admin table
// //     await Admin.drop();
// //     console.log("✅ Admin table dropped");

// //     // Recreate it
// //     await Admin.sync({ force: true }); 
// //     console.log("✅ Admin table recreated");
    
// //     await sequelize.close();
// //   } catch (err) {
// //     console.error("❌ Error resetting Admin table:", err);
// //   }
// // })();


// somewhere in your startup file (app.js / server.js)
// import sequelize from "./models/index.js";
// import "./models/Admin.js";

// (async () => {
//   await sequelize.sync({ alter: true }); 
//   console.log("✅ Admin model updated in DB");
// })();


// import sequelize from './models/index.js';
// import Student from "./models/Student.js";

// (async () => {
//   await sequelize.sync({ alter: true }); // alters only this table
//   console.log("✅ TeamUpload table updated");
// })();



// import User from './models/User.js';

// async function lockAllUsers() {
//   try {
//     const [rowsUpdated] = await User.update(
//       { isLocked: true }, // set isLocked = 1 (true)
//       { where: {} }       // empty where → affects all rows
//     );
//     console.log(`${rowsUpdated} users updated successfully.`);
//   } catch (error) {
//     console.error('Error updating users:', error);
//   }
// }

// lockAllUsers();



// import sequelize from './models/index.js';
// // import IdeaSelection from "./models/Idea.js";
// import Student from './models/Student.js';

// (async () => {
//   await Student.sync({ alter: true }); // drops 'date' column from table
//   console.log("✅ Student table updated (date removed)");
// })();


import sequelize from "./models/index.js";
import Student from "./models/Student.js";
import { Op, literal } from "sequelize";  // ✅ FIX: Import Op and literal properly

(async () => {
  try {
    console.log("🚀 Starting score update...");

    // ✅ Multiply review1_score and review2_score by 1.5 safely
  const [rowsUpdated] = await Student.update(
  {
    review1_score: literal("ROUND(review1_score * 1.5)"),
    review2_score: literal("ROUND(review2_score * 1.5)"),
  },
  {
    where: {
      [Op.or]: [
        { review1_score: { [Op.ne]: null } },
        { review2_score: { [Op.ne]: null } },
      ],
    },
  }
);



    console.log(`✅ Review scores updated successfully (×1.5). Rows affected: ${rowsUpdated}`);

    await sequelize.close();
  } catch (err) {
    console.error("❌ Error updating scores:", err);
    await sequelize.close();
  }
})();


