const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const PlatformPayment = sequelize.define(
  "PlatformPayment",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    subscription_id: { type: DataTypes.INTEGER, allowNull: true },
    amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    method: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "wave" },
    status: {
      type: DataTypes.ENUM("PENDING", "PAID", "FAILED", "CANCELLED"),
      defaultValue: "PENDING",
    },
    reference: { type: DataTypes.STRING(120), allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "platform_payments" }
);

module.exports = PlatformPayment;
