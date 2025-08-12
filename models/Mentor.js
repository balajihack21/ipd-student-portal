import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Mentor = sequelize.define('Mentor', {
  mentorId: {
    type: DataTypes.INTEGER.UNSIGNED,
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
  },
  is_coordinator:{
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  firstLogin: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
}, {
  tableName: 'mentors'
});

export default Mentor;
