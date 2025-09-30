import { DataTypes } from "sequelize";
import sequelize from "./index.js";
import User from "./User.js";

const IdeaSelection = sequelize.define("IdeaSelection", {
  team_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  list_of_ideas: {
    type: DataTypes.JSON, // array of idea names
    allowNull: false,
  },
  // store idea-wise criteria scores as JSON
  ideas_scores: {
    type: DataTypes.JSON, 
    allowNull: true,
    // Example structure:
    // {
    //   "Idea 1": { "Value": 4, "Functionality": 3, "Problem Relevance": 5, ... },
    //   "Idea 2": { ... }
    // }
  },

  // store average score per idea as JSON
  ideas_avg_score: {
    type: DataTypes.JSON,
    allowNull: true,
    // Example: { "Idea 1": 4.2, "Idea 2": 3.8, ... }
  },

  // overall average across all ideas
  overall_avg_score: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
}, {
  tableName: "idea_selection",
  timestamps: true,
});

// Association with User
IdeaSelection.belongsTo(User, { foreignKey: "user_id" });
User.hasMany(IdeaSelection, { foreignKey: "user_id" });

// Auto-calculate idea averages and overall average before save
IdeaSelection.beforeSave((record) => {
  if (record.ideas_scores) {
    const ideas_avg = {};
    let totalSum = 0;
    let totalCount = 0;

    for (const [idea, criteria] of Object.entries(record.ideas_scores)) {
      const scores = Object.values(criteria).filter(s => s !== null && s !== undefined);
      if (scores.length > 0) {
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        ideas_avg[idea] = parseFloat(avg.toFixed(2));
        totalSum += scores.reduce((a, b) => a + b, 0);
        totalCount += scores.length;
      } else {
        ideas_avg[idea] = null;
      }
    }

    record.ideas_avg_score = ideas_avg;
    record.overall_avg_score = totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(2)) : null;
  }
});

export default IdeaSelection;
