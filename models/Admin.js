// models/Admin.js
import { DataTypes } from 'sequelize';
import sequelize from './index.js';

const Admin = sequelize.define('Admin', {
  adminId: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
    allowNull: false,
    autoIncrement: true
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
  token: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'admins'
});

export default Admin;
