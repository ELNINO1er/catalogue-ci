const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const StoreTemplate = sequelize.define(
  "StoreTemplate",
  {
    name: { type: DataTypes.STRING(100), allowNull: false },
    slug: { type: DataTypes.STRING(120), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    colors_json: { type: DataTypes.TEXT, allowNull: true },
    is_premium: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "store_templates" }
);

module.exports = StoreTemplate;
