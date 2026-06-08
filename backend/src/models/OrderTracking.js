const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderTracking = sequelize.define(
  "OrderTracking",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: true },
    customer_message: { type: DataTypes.TEXT },
    clicked_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    ip_address: { type: DataTypes.STRING(64) },
    user_agent: { type: DataTypes.STRING(255) },
  },
  { tableName: "orders_tracking", timestamps: false }
);

module.exports = OrderTracking;
