const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderStatusHistory = sequelize.define(
  "OrderStatusHistory",
  {
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    old_status: { type: DataTypes.STRING(40), allowNull: true },
    new_status: { type: DataTypes.STRING(40), allowNull: false },
    old_payment_status: { type: DataTypes.STRING(40), allowNull: true },
    new_payment_status: { type: DataTypes.STRING(40), allowNull: true },
    changed_by_user_id: { type: DataTypes.INTEGER, allowNull: true },
    actor: { type: DataTypes.STRING(30), defaultValue: "system" },
    note: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "order_status_history", updatedAt: false }
);

module.exports = OrderStatusHistory;
