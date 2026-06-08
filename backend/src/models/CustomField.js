const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CustomField = sequelize.define(
  "CustomField",
  {
    business_id: { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING(150), allowNull: false },
    field_type: {
      type: DataTypes.ENUM(
        "text",
        "textarea",
        "number",
        "phone",
        "email",
        "date",
        "time",
        "select",
        "checkbox",
        "radio",
        "file",
        "address"
      ),
      allowNull: false,
    },
    options_json: { type: DataTypes.TEXT, allowNull: true },
    is_required: { type: DataTypes.BOOLEAN, defaultValue: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  { tableName: "custom_fields" }
);

module.exports = CustomField;
