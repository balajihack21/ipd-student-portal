import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const Student = sequelize.define('Student', {
  register_no: {
    type: DataTypes.BIGINT,
    allowNull: false,
    unique: true,
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
  },
  rubric1: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric2: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric3: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric4: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  rubric5: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
 review1_score: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'students'
});

// Associations
Student.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Student, { foreignKey: 'user_id' });

export default Student;
