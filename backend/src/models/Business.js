const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Business = sequelize.define(
  "Business",
  {
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    logo_url: { type: DataTypes.STRING(500) },
    description: { type: DataTypes.TEXT },
    category_id: { type: DataTypes.INTEGER, allowNull: true },
    template_id: { type: DataTypes.INTEGER, allowNull: true },
    whatsapp_number: { type: DataTypes.STRING(20), allowNull: false },
    phone_number: { type: DataTypes.STRING(20) },
    address: { type: DataTypes.STRING(255) },
    google_maps_url: { type: DataTypes.STRING(500) },
    opening_hours: { type: DataTypes.STRING(255) },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "businesses" }
);

module.exports = Business;
