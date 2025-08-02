import { DataTypes } from 'sequelize';
import sequelize from './index.js';
import User from './User.js';

const TeamUpload = sequelize.define('TeamUpload', {
  file_url: {
    type: DataTypes.STRING(255),
    allowNull: false
  },
  week_number: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  uploaded_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('SUBMITTED', 'REVIEWED'),
    defaultValue: 'SUBMITTED'
  },
  review_comment: {
    type: DataTypes.TEXT
  }
}, {
  tableName: 'team_uploads',
  indexes: [
    {
      unique: true,
      fields: ['user_id', 'week_number']
    }
  ]
});

// Associations
TeamUpload.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(TeamUpload, { foreignKey: 'user_id' });

export default TeamUpload;
