const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const BusinessPaymentMethod = sequelize.define(
  "BusinessPaymentMethod",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    payment_method_id: { type: DataTypes.INTEGER, allowNull: false },
  },
  { tableName: "business_payment_methods" }
);

module.exports = BusinessPaymentMethod;
