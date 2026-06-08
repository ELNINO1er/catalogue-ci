const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OrderFieldValue = sequelize.define(
  "OrderFieldValue",
  {
    order_id: { type: DataTypes.INTEGER, allowNull: false },
    field_id: { type: DataTypes.INTEGER, allowNull: false },
    value: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: "order_field_values" }
);

module.exports = OrderFieldValue;
