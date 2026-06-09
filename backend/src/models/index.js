const sequelize = require("../config/database");
const User = require("./User");
const Business = require("./Business");
const Product = require("./Product");
const Category = require("./Category");
const PaymentMethod = require("./PaymentMethod");
const BusinessPaymentMethod = require("./BusinessPaymentMethod");
const OrderTracking = require("./OrderTracking");
const CustomField = require("./CustomField");
const Order = require("./Order");
const OrderFieldValue = require("./OrderFieldValue");
const MerchantPaymentSettings = require("./MerchantPaymentSettings");
const Plan = require("./Plan");
const Subscription = require("./Subscription");
const PlatformPayment = require("./PlatformPayment");
const StoreTemplate = require("./StoreTemplate");
const ActivityLog = require("./ActivityLog");
const PlatformSetting = require("./PlatformSetting");
const OrderStatusHistory = require("./OrderStatusHistory");
const MessageTemplate = require("./MessageTemplate");

Category.hasMany(Business, { foreignKey: "category_id", as: "businesses" });
Business.belongsTo(Category, { foreignKey: "category_id", as: "category" });

StoreTemplate.hasMany(Business, { foreignKey: "template_id", as: "businesses" });
Business.belongsTo(StoreTemplate, { foreignKey: "template_id", as: "template" });

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

Business.hasMany(CustomField, { foreignKey: "business_id", as: "customFields", onDelete: "CASCADE" });
CustomField.belongsTo(Business, { foreignKey: "business_id", as: "business" });
Product.hasMany(CustomField, { foreignKey: "product_id", as: "customFields", onDelete: "CASCADE" });
CustomField.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Business.hasMany(Order, { foreignKey: "business_id", as: "orders", onDelete: "CASCADE" });
Order.belongsTo(Business, { foreignKey: "business_id", as: "business" });
Product.hasMany(Order, { foreignKey: "product_id", as: "orders" });
Order.belongsTo(Product, { foreignKey: "product_id", as: "product" });

Order.hasMany(OrderFieldValue, { foreignKey: "order_id", as: "fieldValues", onDelete: "CASCADE" });
OrderFieldValue.belongsTo(Order, { foreignKey: "order_id", as: "order" });
CustomField.hasMany(OrderFieldValue, { foreignKey: "field_id", as: "orderValues" });
OrderFieldValue.belongsTo(CustomField, { foreignKey: "field_id", as: "field" });

Business.hasOne(MerchantPaymentSettings, {
  foreignKey: "business_id",
  as: "paymentSettings",
  onDelete: "CASCADE",
});
MerchantPaymentSettings.belongsTo(Business, { foreignKey: "business_id", as: "business" });

Business.hasMany(Subscription, { foreignKey: "business_id", as: "subscriptions", onDelete: "CASCADE" });
Subscription.belongsTo(Business, { foreignKey: "business_id", as: "business" });
Plan.hasMany(Subscription, { foreignKey: "plan_id", as: "subscriptions" });
Subscription.belongsTo(Plan, { foreignKey: "plan_id", as: "plan" });

Business.hasMany(PlatformPayment, { foreignKey: "business_id", as: "platformPayments", onDelete: "CASCADE" });
PlatformPayment.belongsTo(Business, { foreignKey: "business_id", as: "business" });
Subscription.hasMany(PlatformPayment, { foreignKey: "subscription_id", as: "payments" });
PlatformPayment.belongsTo(Subscription, { foreignKey: "subscription_id", as: "subscription" });

Order.hasMany(OrderStatusHistory, { foreignKey: "order_id", as: "statusHistory", onDelete: "CASCADE" });
OrderStatusHistory.belongsTo(Order, { foreignKey: "order_id", as: "order" });
OrderStatusHistory.belongsTo(User, { foreignKey: "changed_by_user_id", as: "changedBy" });

Business.hasMany(MessageTemplate, { foreignKey: "business_id", as: "messageTemplates", onDelete: "CASCADE" });
MessageTemplate.belongsTo(Business, { foreignKey: "business_id", as: "business" });

User.hasMany(ActivityLog, { foreignKey: "user_id", as: "activityLogs" });
ActivityLog.belongsTo(User, { foreignKey: "user_id", as: "user" });
Business.hasMany(ActivityLog, { foreignKey: "business_id", as: "activityLogs" });
ActivityLog.belongsTo(Business, { foreignKey: "business_id", as: "business" });

module.exports = {
  sequelize,
  User,
  Business,
  Product,
  Category,
  PaymentMethod,
  BusinessPaymentMethod,
  OrderTracking,
  CustomField,
  Order,
  OrderFieldValue,
  MerchantPaymentSettings,
  Plan,
  Subscription,
  PlatformPayment,
  StoreTemplate,
  ActivityLog,
  PlatformSetting,
  OrderStatusHistory,
  MessageTemplate,
};
