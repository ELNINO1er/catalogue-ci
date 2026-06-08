const sequelize = require("../config/database");
const User = require("./User");
const Business = require("./Business");
const Product = require("./Product");
const Category = require("./Category");
const PaymentMethod = require("./PaymentMethod");
const BusinessPaymentMethod = require("./BusinessPaymentMethod");
const OrderTracking = require("./OrderTracking");

Category.hasMany(Business, { foreignKey: "category_id", as: "businesses" });
Business.belongsTo(Category, { foreignKey: "category_id", as: "category" });

Business.hasMany(Product, { foreignKey: "business_id", as: "products", onDelete: "CASCADE" });
Product.belongsTo(Business, { foreignKey: "business_id", as: "business" });

Business.hasMany(User, { foreignKey: "business_id", as: "users" });
User.belongsTo(Business, { foreignKey: "business_id", as: "business" });

Business.belongsToMany(PaymentMethod, {
  through: BusinessPaymentMethod,
  foreignKey: "business_id",
  otherKey: "payment_method_id",
  as: "paymentMethods",
});
PaymentMethod.belongsToMany(Business, {
  through: BusinessPaymentMethod,
  foreignKey: "payment_method_id",
  otherKey: "business_id",
  as: "businesses",
});

Business.hasMany(OrderTracking, { foreignKey: "business_id", as: "tracking" });
OrderTracking.belongsTo(Business, { foreignKey: "business_id", as: "business" });
OrderTracking.belongsTo(Product, { foreignKey: "product_id", as: "product" });

module.exports = {
  sequelize,
  User,
  Business,
  Product,
  Category,
  PaymentMethod,
  BusinessPaymentMethod,
  OrderTracking,
};
