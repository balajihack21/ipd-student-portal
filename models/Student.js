import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const Student = sequelize.define('Student', {
  register_no: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  student_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dept: {
    type: DataTypes.STRING,
    allowNull: false
  },
  section: {
    type: DataTypes.STRING,
    allowNull: false
  },
   mobile: {
    type: DataTypes.STRING(12),
    allowNull: true,
    defaultValue: null
  },
  is_leader: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  tableName: 'students'
});

// Associations
Student.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Student, { foreignKey: 'user_id' });

export default Student;
