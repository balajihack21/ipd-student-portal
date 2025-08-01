const { DataTypes } = require('sequelize');
const sequelize = require('./index');
const Mentor = require('./Mentor');
const User = sequelize.define('User', {
    UserId: {
        type: DataTypes.STRING, // ✅ Match foreign key type
        primaryKey: true,
        allowNull: false,
        unique: true
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    mobile: {
        type: DataTypes.STRING(12),
        allowNull: false
    },
    team_name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    token: {
        type: DataTypes.STRING,
        allowNull: true
    },
    mentor_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        references: {
            model: 'mentors',
            key: 'mentorId'
        },
        onDelete: 'CASCADE'
    },
    firstLogin: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // 👈 Important
    }
}, { tableName: 'users' });
Mentor.hasMany(User, {
    foreignKey: 'mentor_id',
    as: 'teams'
});

User.belongsTo(Mentor, {
    foreignKey: 'mentor_id',
    as: 'mentor'
});

module.exports = User;
