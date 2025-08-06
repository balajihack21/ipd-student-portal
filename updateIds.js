// scripts/updateUserIds.js
import User from './models/User.js';
import sequelize from './models/index.js';

async function updateUserIds() {
    try {
        await sequelize.authenticate();
        console.log("DB connected.");

        const users = await User.findAll({
            order: [['createdAt', 'ASC']]  // Optional: keep consistent order
        });

        for (let i = 0; i < users.length; i++) {
            const newId = `24ipd${String(i + 1).padStart(3, '0')}`;
            const user = users[i];

            console.log(`Updating ${user.UserId} → ${newId}`);
            await User.update(
                { UserId: newId },
                { where: { UserId: user.UserId } }
            );

        }

        console.log("✅ All UserIds updated successfully.");
        process.exit();
    } catch (error) {
        console.error("❌ Error updating UserIds:", error);
        process.exit(1);
    }
}

updateUserIds();
