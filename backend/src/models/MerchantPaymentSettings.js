const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const MerchantPaymentSettings = sequelize.define(
  "MerchantPaymentSettings",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    wave_phone_number: { type: DataTypes.STRING(30), allowNull: true },
    wave_account_name: { type: DataTypes.STRING(120), allowNull: true },
    payment_instructions: { type: DataTypes.TEXT, allowNull: true },
    payment_mode: { type: DataTypes.STRING(50), allowNull: false, defaultValue: "manual" },
    is_wave_checkout_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_wave_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_cod_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_whatsapp_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "merchant_payment_settings" }
);

module.exports = MerchantPaymentSettings;
