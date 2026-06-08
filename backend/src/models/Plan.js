const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Plan = sequelize.define(
  "Plan",
  {
    name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    product_limit: { type: DataTypes.INTEGER, allowNull: true },
    order_limit: { type: DataTypes.INTEGER, allowNull: true },
    features_json: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "plans" }
);

module.exports = Plan;
