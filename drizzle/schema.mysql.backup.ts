import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

// User roles enum
export const userRoleEnum = mysqlEnum("role", ["user", "admin", "agent"]);

// Users table with extended fields for IPTV platform
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "agent"]).default("user").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Subscription plans table
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  durationDays: int("durationDays").notNull().default(30),
  maxConnections: int("maxConnections").notNull().default(10),
  isActive: boolean("isActive").default(true).notNull(),
  features: json("features").$type<string[]>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Plan pricing rules - different price per connection count
export const planPricing = mysqlTable("planPricing", {
  id: int("id").autoincrement().primaryKey(),
  planId: int("planId").notNull(),
  connections: int("connections").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Payment widgets for NowPayments - admin assigns per plan
export const paymentWidgets = mysqlTable("paymentWidgets", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  planId: int("planId").notNull(),
  minConnections: int("minConnections").notNull().default(1),
  maxConnections: int("maxConnections").notNull().default(10),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(), // NowPayments widget invoice ID (iid)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Manual payment methods (Card, PayPal, custom) - assigned per plan and connection range
export const paymentMethods = mysqlTable("paymentMethods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["card", "paypal", "crypto", "custom"]).notNull(),
  planId: int("planId").notNull(), // Specific plan this payment method is for
  minConnections: int("minConnections").notNull().default(1), // Minimum connections
  maxConnections: int("maxConnections").notNull().default(10), // Maximum connections
  instructions: text("instructions"),
  paymentLink: text("paymentLink"),
  iconUrl: text("iconUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Order status enum
export const orderStatusEnum = mysqlEnum("status", ["pending", "verified", "rejected"]);

// Orders table
export const orders = mysqlTable("orders", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  planId: int("planId").notNull(),
  connections: int("connections").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  paymentMethodId: int("paymentMethodId"),
  paymentWidgetId: int("paymentWidgetId"),
  paymentMethodName: varchar("paymentMethodName", { length: 255 }),
  paymentMethodType: varchar("paymentMethodType", { length: 50 }),
  status: mysqlEnum("status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  paymentConfirmedAt: timestamp("paymentConfirmedAt"),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: int("verifiedBy"),
  rejectedAt: timestamp("rejectedAt"),
  rejectedBy: int("rejectedBy"),
  rejectionReason: text("rejectionReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// IPTV credential types
export const credentialTypeEnum = mysqlEnum("credentialType", ["xtream", "m3u", "portal"]);

// IPTV credentials table
export const iptvCredentials = mysqlTable("iptvCredentials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orderId: int("orderId").notNull(),
  connectionNumber: int("connectionNumber").notNull(),
  credentialType: mysqlEnum("credentialType", ["xtream", "m3u", "portal"]).notNull(),
  // Xtream Codes fields
  serverUrl: text("serverUrl"),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  // M3U fields
  m3uUrl: text("m3uUrl"),
  epgUrl: text("epgUrl"),
  // Portal fields
  portalUrl: text("portalUrl"),
  macAddress: varchar("macAddress", { length: 50 }),
  expiresAt: timestamp("expiresAt"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Chat conversations
export const chatConversations = mysqlTable("chatConversations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 255 }),
  status: mysqlEnum("status", ["open", "closed"]).default("open").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Chat messages
export const chatMessages = mysqlTable("chatMessages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  senderRole: mysqlEnum("senderRole", ["user", "admin", "agent"]).notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Email templates
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  textContent: text("textContent"),
  variables: json("variables").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Activity logs
export const activityLogs = mysqlTable("activityLogs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: int("entityId"),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Site settings for general configuration
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;
export type PlanPricing = typeof planPricing.$inferSelect;
export type InsertPlanPricing = typeof planPricing.$inferInsert;
export type PaymentWidget = typeof paymentWidgets.$inferSelect;
export type InsertPaymentWidget = typeof paymentWidgets.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = typeof paymentMethods.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = typeof orders.$inferInsert;
export type IptvCredential = typeof iptvCredentials.$inferSelect;
export type InsertIptvCredential = typeof iptvCredentials.$inferInsert;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = typeof chatConversations.$inferInsert;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = typeof chatMessages.$inferInsert;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;
export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = typeof activityLogs.$inferInsert;
export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;
