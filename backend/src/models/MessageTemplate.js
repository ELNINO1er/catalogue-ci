const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MessageTemplate = sequelize.define(
  "MessageTemplate",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    type: {
      type: DataTypes.ENUM("order_received", "payment_sent", "order_confirmed", "order_delivered", "payment_reminder"),
      allowNull: false,
    },
    title: { type: DataTypes.STRING(150), allowNull: false },
    content: { type: DataTypes.TEXT, allowNull: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "message_templates" }
);

module.exports = MessageTemplate;
