const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const User = sequelize.define(
  "User",
  {
    name: { type: DataTypes.STRING(150), allowNull: false },
    email: {
      type: DataTypes.STRING(180),
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
    },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    role: {
      type: DataTypes.ENUM("SUPER_ADMIN", "MERCHANT"),
      defaultValue: "MERCHANT",
    },
    business_id: { type: DataTypes.INTEGER, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    // Mot de passe oublie : seul le hash SHA-256 du jeton est stocke.
    reset_token_hash: { type: DataTypes.STRING(64), allowNull: true },
    reset_token_expires_at: { type: DataTypes.DATE, allowNull: true },
    // Les jetons de connexion emis avant cette date sont refuses.
    password_changed_at: { type: DataTypes.DATE, allowNull: true },
    terms_accepted_at: { type: DataTypes.DATE, allowNull: true },
  },
  { tableName: "users" }
);

// Jamais de secret dans une reponse JSON, quelle que soit la route.
User.prototype.toJSON = function toJSON() {
  const values = { ...this.get() };
  delete values.password_hash;
  delete values.reset_token_hash;
  delete values.reset_token_expires_at;
  return values;
};

module.exports = User;
