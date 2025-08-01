const { DataTypes } = require('sequelize');
const  sequelize  = require('./index');
const User = require('./User');

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
  is_leader: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, { tableName: 'students' });

Student.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Student, { foreignKey: 'user_id' });

module.exports = Student;
