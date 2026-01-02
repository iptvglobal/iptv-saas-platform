import { pgTable, serial, text, varchar, boolean, timestamp, integer, numeric, json, pgEnum } from "drizzle-orm/pg-core";

// User roles enum
export const userRoleEnum = pgEnum("role", ["user", "admin", "agent"]);

// Users table with extended fields for IPTV platform
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: userRoleEnum("role").default("user").notNull(),
  emailVerified: boolean("emailVerified").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// Subscription plans table
export const plans = pgTable("plans", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  durationDays: integer("durationDays").notNull().default(30),
  maxConnections: integer("maxConnections").notNull().default(10),
  isActive: boolean("isActive").default(true).notNull(),
  features: json("features").$type<string[]>(),
  promoText: varchar("promoText", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Plan pricing rules - different price per connection count
export const planPricing = pgTable("planPricing", {
  id: serial("id").primaryKey(),
  planId: integer("planId").notNull(),
  connections: integer("connections").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Payment widgets for NowPayments - admin assigns per plan
export const paymentWidgets = pgTable("paymentWidgets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  planId: integer("planId").notNull(),
  minConnections: integer("minConnections").notNull().default(1),
  maxConnections: integer("maxConnections").notNull().default(10),
  invoiceId: varchar("invoiceId", { length: 255 }).notNull(), // NowPayments widget invoice ID (iid)
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Payment method type enum
export const paymentMethodTypeEnum = pgEnum("payment_method_type", ["card", "paypal", "crypto", "custom"]);

// Manual payment methods (Card, PayPal, custom) - assigned per plan and connection range
export const paymentMethods = pgTable("paymentMethods", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: paymentMethodTypeEnum("type").notNull(),
  planId: integer("planId").notNull(), // Specific plan this payment method is for
  minConnections: integer("minConnections").notNull().default(1), // Minimum connections
  maxConnections: integer("maxConnections").notNull().default(10), // Maximum connections
  instructions: text("instructions"),
  paymentLink: text("paymentLink"),
  iconUrl: text("iconUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: integer("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Order status enum
export const orderStatusEnum = pgEnum("order_status", ["pending", "verified", "rejected"]);

// Orders table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  planId: integer("planId").notNull(),
  connections: integer("connections").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  paymentMethodId: integer("paymentMethodId"),
  paymentWidgetId: integer("paymentWidgetId"),
  paymentMethodName: varchar("paymentMethodName", { length: 255 }),
  paymentMethodType: varchar("paymentMethodType", { length: 50 }),
  status: orderStatusEnum("status").default("pending").notNull(),
  paymentConfirmedAt: timestamp("paymentConfirmedAt"),
  verifiedAt: timestamp("verifiedAt"),
  verifiedBy: integer("verifiedBy"),
  rejectedAt: timestamp("rejectedAt"),
  rejectedBy: integer("rejectedBy"),
  rejectionReason: text("rejectionReason"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// IPTV credential types enum
export const credentialTypeEnum = pgEnum("credential_type", ["xtream", "m3u", "portal", "combined"]);

// IPTV credentials table
export const iptvCredentials = pgTable("iptvCredentials", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  orderId: integer("orderId").notNull(),
  connectionNumber: integer("connectionNumber").notNull(),
  credentialType: credentialTypeEnum("credentialType").notNull(),
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
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Chat conversation status enum
export const chatStatusEnum = pgEnum("chat_status", ["open", "closed"]);

// Chat conversations
export const chatConversations = pgTable("chatConversations", {
  id: serial("id").primaryKey(),
  userId: integer("userId").notNull(),
  subject: varchar("subject", { length: 255 }),
  status: chatStatusEnum("status").default("open").notNull(),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Sender role enum
export const senderRoleEnum = pgEnum("sender_role", ["user", "admin", "agent"]);

// Chat messages
export const chatMessages = pgTable("chatMessages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversationId").notNull(),
  senderId: integer("senderId").notNull(),
  senderRole: senderRoleEnum("senderRole").notNull(),
  message: text("message").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Email templates
export const emailTemplates = pgTable("emailTemplates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  subject: varchar("subject", { length: 255 }).notNull(),
  htmlContent: text("htmlContent").notNull(),
  textContent: text("textContent"),
  variables: json("variables").$type<string[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

// Activity logs
export const activityLogs = pgTable("activityLogs", {
  id: serial("id").primaryKey(),
  userId: integer("userId"),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entityType", { length: 50 }),
  entityId: integer("entityId"),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Site settings for general configuration
export const siteSettings = pgTable("siteSettings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  description: text("description"),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
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
