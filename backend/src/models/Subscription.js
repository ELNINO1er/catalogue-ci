const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Subscription = sequelize.define(
  "Subscription",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    plan_id: { type: DataTypes.INTEGER, allowNull: false },
    status: {
      type: DataTypes.ENUM("TRIAL", "ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"),
      defaultValue: "TRIAL",
    },
    starts_at: { type: DataTypes.DATE, allowNull: true },
    ends_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "subscriptions" }
);

module.exports = Subscription;
