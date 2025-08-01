const { DataTypes } = require('sequelize');
const sequelize = require('./index');

const Mentor = sequelize.define('Mentor', {
  mentorId: {
    type: DataTypes.INTEGER.UNSIGNED, // ✅ Match foreign key type
    primaryKey: true,
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING(10)
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  department: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  designation: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  password: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  token: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, { tableName: 'mentors' });

module.exports = Mentor;
