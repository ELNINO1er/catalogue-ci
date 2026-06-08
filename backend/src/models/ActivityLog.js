const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ActivityLog = sequelize.define(
  "ActivityLog",
  {
    user_id: { type: DataTypes.INTEGER, allowNull: true },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    action: { type: DataTypes.STRING(120), allowNull: false },
    module: { type: DataTypes.STRING(80), allowNull: false },
    ip_address: { type: DataTypes.STRING(64), allowNull: true },
    details_json: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "activity_logs" }
);

module.exports = ActivityLog;
