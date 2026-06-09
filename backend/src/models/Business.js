const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Business = sequelize.define(
  "Business",
  {
    name: { type: DataTypes.STRING(150), allowNull: false },
    slug: { type: DataTypes.STRING(180), allowNull: false, unique: true },
    logo_url: { type: DataTypes.STRING(500) },
    banner_url: { type: DataTypes.STRING(500) },
    description: { type: DataTypes.TEXT },
    category_id: { type: DataTypes.INTEGER, allowNull: true },
    template_id: { type: DataTypes.INTEGER, allowNull: true },
    whatsapp_number: { type: DataTypes.STRING(20), allowNull: false },
    phone_number: { type: DataTypes.STRING(20) },
    email: { type: DataTypes.STRING(180), allowNull: true },
    address: { type: DataTypes.STRING(255) },
    google_maps_url: { type: DataTypes.STRING(500) },
    opening_hours: { type: DataTypes.STRING(255) },
    terms_text: { type: DataTypes.TEXT },
    delivery_policy: { type: DataTypes.TEXT },
    welcome_message: { type: DataTypes.TEXT },
    primary_color: { type: DataTypes.STRING(20), allowNull: true },
    secondary_color: { type: DataTypes.STRING(20), allowNull: true },
    button_color: { type: DataTypes.STRING(20), allowNull: true },
    display_style: { type: DataTypes.STRING(30), allowNull: true },
    theme_mode: { type: DataTypes.STRING(20), allowNull: true },
    font_family: { type: DataTypes.STRING(80), allowNull: true },
    text_color: { type: DataTypes.STRING(20), allowNull: true },
    background_color: { type: DataTypes.STRING(20), allowNull: true },
    business_type: { type: DataTypes.STRING(80), allowNull: true },
    city: { type: DataTypes.STRING(100), allowNull: true },
    commune: { type: DataTypes.STRING(100), allowNull: true },
    onboarding_completed: { type: DataTypes.BOOLEAN, defaultValue: false },
    onboarding_step: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { tableName: "businesses" }
);

module.exports = Business;
