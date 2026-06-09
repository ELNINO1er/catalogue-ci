const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Order = sequelize.define(
  "Order",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    customer_name: { type: DataTypes.STRING(150), allowNull: false },
    customer_phone: { type: DataTypes.STRING(30), allowNull: false },
    customer_email: { type: DataTypes.STRING(180), allowNull: true },
    total_amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
    status: {
      type: DataTypes.ENUM(
        "PENDING",
        "AWAITING_PAYMENT",
        "AWAITING_VERIFICATION",
        "PAID",
        "CONFIRMED",
        "IN_PROGRESS",
        "READY",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED"
      ),
      defaultValue: "PENDING",
    },
    payment_status: {
      type: DataTypes.ENUM("PENDING", "PROCESSING", "PAID", "FAILED", "CANCELLED", "REFUNDED"),
      defaultValue: "PENDING",
    },
    payment_method: { type: DataTypes.STRING(50), allowNull: true },
    wave_checkout_session_id: { type: DataTypes.STRING(120), allowNull: true },
    wave_launch_url: { type: DataTypes.STRING(500), allowNull: true },
    wave_transaction_id: { type: DataTypes.STRING(120), allowNull: true },
    paid_at: { type: DataTypes.DATE, allowNull: true },
    payment_proof_reference: { type: DataTypes.STRING(120), allowNull: true },
    payment_proof_sender: { type: DataTypes.STRING(120), allowNull: true },
    payment_proof_note: { type: DataTypes.TEXT, allowNull: true },
    payment_proof_image: { type: DataTypes.STRING(500), allowNull: true },
  },
  { tableName: "orders" }
);

module.exports = Order;
