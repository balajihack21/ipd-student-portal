// models/User.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import Mentor from './Mentor.js';

const User = sequelize.define('User', {
  UserId: {
    type: DataTypes.STRING,
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
  profilePhoto: {
  type: DataTypes.STRING,
  allowNull: true,
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
    defaultValue: true
  },
  
}, { tableName: 'users' });

// Associations
Mentor.hasMany(User, {
  foreignKey: 'mentor_id',
  as: 'teams'
});

User.belongsTo(Mentor, {
  foreignKey: 'mentor_id',
  as: 'mentor'
});

export default User;
