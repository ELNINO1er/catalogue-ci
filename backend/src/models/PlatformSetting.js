const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PlatformSetting = sequelize.define(
  "PlatformSetting",
  {
    key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    value: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "platform_settings" }
);

module.exports = PlatformSetting;
