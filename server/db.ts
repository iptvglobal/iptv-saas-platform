import { eq, and, desc, asc, gte, lte, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  InsertUser, users, 
  plans, InsertPlan,
  planPricing, InsertPlanPricing,
  paymentWidgets, InsertPaymentWidget,
  paymentMethods, InsertPaymentMethod,
  orders, InsertOrder,
  iptvCredentials, InsertIptvCredential,
  chatConversations, InsertChatConversation,
  chatMessages, InsertChatMessage,
  emailTemplates, InsertEmailTemplate,
  activityLogs, InsertActivityLog,
  siteSettings, InsertSiteSetting
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;
let _client: ReturnType<typeof postgres> | null = null;

export async function getDb() {
  if (!_db) {
    try {
      // Use DATABASE_URL environment variable
      const connectionString = process.env.DATABASE_URL;
      
      if (!connectionString) {
        console.warn("[Database] No DATABASE_URL configured");
        return null;
      }
      
      _client = postgres(connectionString);
      _db = drizzle(_client);
      console.log("[Database] Connected successfully");
    } catch (error) {
      console.error("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL: Use ON CONFLICT instead of onDuplicateKeyUpdate
    await db.insert(users).values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUserRole(userId: number, role: "user" | "admin" | "agent") {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({ role }).where(eq(users.id, userId));
}

export async function deleteUser(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, userId));
}

// ============ PLAN QUERIES ============
export async function createPlan(plan: InsertPlan) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(plans).values(plan).returning({ id: plans.id });
  return result[0]?.id ?? null;
}

export async function updatePlan(id: number, plan: Partial<InsertPlan>) {
  const db = await getDb();
  if (!db) return;
  await db.update(plans).set(plan).where(eq(plans.id, id));
}

export async function deletePlan(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(plans).where(eq(plans.id, id));
}

export async function getPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPlans(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(asc(plans.id));
  }
  return db.select().from(plans).orderBy(asc(plans.id));
}

// ============ PLAN PRICING QUERIES ============
export async function setPlanPricing(planId: number, pricingData: { connections: number; price: string }[]) {
  const db = await getDb();
  if (!db) return;
  
  // Delete existing pricing for this plan
  await db.delete(planPricing).where(eq(planPricing.planId, planId));
  
  // Insert new pricing
  if (pricingData.length > 0) {
    await db.insert(planPricing).values(
      pricingData.map(p => ({
        planId,
        connections: p.connections,
        price: p.price,
      }))
    );
  }
}

export async function getPlanPricing(planId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planPricing).where(eq(planPricing.planId, planId)).orderBy(asc(planPricing.connections));
}

export async function getAllPlanPricing() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(planPricing).orderBy(asc(planPricing.planId), asc(planPricing.connections));
}

// ============ PAYMENT WIDGET QUERIES ============
export async function createPaymentWidget(widget: InsertPaymentWidget) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(paymentWidgets).values(widget).returning({ id: paymentWidgets.id });
  return result[0]?.id ?? null;
}

export async function updatePaymentWidget(id: number, widget: Partial<InsertPaymentWidget>) {
  const db = await getDb();
  if (!db) return;
  await db.update(paymentWidgets).set(widget).where(eq(paymentWidgets.id, id));
}

export async function deletePaymentWidget(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(paymentWidgets).where(eq(paymentWidgets.id, id));
}

export async function getPaymentWidgetForPlan(planId: number, connections: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(paymentWidgets)
    .where(and(
      eq(paymentWidgets.planId, planId),
      lte(paymentWidgets.minConnections, connections),
      gte(paymentWidgets.maxConnections, connections),
      eq(paymentWidgets.isActive, true)
    ))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPaymentWidgets() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentWidgets).orderBy(asc(paymentWidgets.planId), asc(paymentWidgets.minConnections));
}

// ============ PAYMENT METHOD QUERIES ============
export async function createPaymentMethod(method: InsertPaymentMethod) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(paymentMethods).values(method).returning({ id: paymentMethods.id });
  return result[0]?.id ?? null;
}

export async function updatePaymentMethod(id: number, method: Partial<InsertPaymentMethod>) {
  const db = await getDb();
  if (!db) return;
  await db.update(paymentMethods).set(method).where(eq(paymentMethods.id, id));
}

export async function deletePaymentMethod(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(paymentMethods).where(eq(paymentMethods.id, id));
}

export async function getPaymentMethodById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(paymentMethods).where(eq(paymentMethods.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllPaymentMethods(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(paymentMethods).where(eq(paymentMethods.isActive, true)).orderBy(asc(paymentMethods.sortOrder));
  }
  return db.select().from(paymentMethods).orderBy(asc(paymentMethods.sortOrder));
}

export async function getPaymentMethodsForPlan(planId: number, connections: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(paymentMethods)
    .where(and(
      eq(paymentMethods.planId, planId),
      lte(paymentMethods.minConnections, connections),
      gte(paymentMethods.maxConnections, connections),
      eq(paymentMethods.isActive, true)
    ))
    .orderBy(asc(paymentMethods.sortOrder));
}

// ============ ORDER QUERIES ============
export async function createOrder(order: InsertOrder) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(orders).values(order).returning({ id: orders.id });
  return result[0]?.id ?? null;
}

export async function updateOrder(id: number, order: Partial<InsertOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(orders).set(order).where(eq(orders.id, id));
}

export async function getOrderById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getOrdersByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.userId, userId)).orderBy(desc(orders.createdAt));
}

export async function getAllOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).orderBy(desc(orders.createdAt));
}

export async function getPendingOrders() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.status, "pending")).orderBy(desc(orders.createdAt));
}

export async function getOrdersByStatus(status: "pending" | "verified" | "rejected") {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orders).where(eq(orders.status, status)).orderBy(desc(orders.createdAt));
}

// ============ IPTV CREDENTIAL QUERIES ============
export async function createIptvCredential(credential: InsertIptvCredential) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(iptvCredentials).values(credential).returning({ id: iptvCredentials.id });
  return result[0]?.id ?? null;
}

export async function updateIptvCredential(id: number, credential: Partial<InsertIptvCredential>) {
  const db = await getDb();
  if (!db) return;
  await db.update(iptvCredentials).set(credential).where(eq(iptvCredentials.id, id));
}

export async function deleteIptvCredential(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(iptvCredentials).where(eq(iptvCredentials.id, id));
}

export async function getCredentialsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(iptvCredentials).where(eq(iptvCredentials.userId, userId)).orderBy(desc(iptvCredentials.createdAt));
}

export async function getCredentialsByOrderId(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(iptvCredentials).where(eq(iptvCredentials.orderId, orderId)).orderBy(asc(iptvCredentials.connectionNumber));
}

export async function getAllCredentials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(iptvCredentials).orderBy(desc(iptvCredentials.createdAt));
}

// ============ CHAT QUERIES ============
export async function createConversation(conversation: InsertChatConversation) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatConversations).values(conversation).returning({ id: chatConversations.id });
  return result[0]?.id ?? null;
}

export async function updateConversation(id: number, conversation: Partial<InsertChatConversation>) {
  const db = await getDb();
  if (!db) return;
  await db.update(chatConversations).set(conversation).where(eq(chatConversations.id, id));
}

export async function getConversationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(chatConversations).where(eq(chatConversations.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getConversationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).where(eq(chatConversations.userId, userId)).orderBy(desc(chatConversations.updatedAt));
}

export async function getAllConversations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatConversations).orderBy(desc(chatConversations.updatedAt));
}

export async function createMessage(message: InsertChatMessage) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(chatMessages).values(message).returning({ id: chatMessages.id });
  
  // Update conversation's lastMessageAt
  if (result[0]?.id) {
    await db.update(chatConversations)
      .set({ lastMessageAt: new Date(), updatedAt: new Date() })
      .where(eq(chatConversations.id, message.conversationId));
  }
  
  return result[0]?.id ?? null;
}

export async function getMessagesByConversationId(conversationId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(chatMessages).where(eq(chatMessages.conversationId, conversationId)).orderBy(asc(chatMessages.createdAt));
}

export async function markMessagesAsRead(conversationId: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  // Mark all messages in conversation as read (except user's own messages)
  await db.update(chatMessages)
    .set({ isRead: true })
    .where(and(
      eq(chatMessages.conversationId, conversationId),
      eq(chatMessages.isRead, false)
    ));
}

// ============ EMAIL TEMPLATE QUERIES ============
export async function getEmailTemplate(name: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(emailTemplates).where(eq(emailTemplates.name, name)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllEmailTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(emailTemplates).orderBy(asc(emailTemplates.name));
}

export async function upsertEmailTemplate(template: InsertEmailTemplate) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(emailTemplates).values(template)
    .onConflictDoUpdate({
      target: emailTemplates.name,
      set: {
        subject: template.subject,
        htmlContent: template.htmlContent,
        textContent: template.textContent,
        variables: template.variables,
        isActive: template.isActive,
        updatedAt: new Date(),
      },
    });
}

// ============ ACTIVITY LOG QUERIES ============
export async function createActivityLog(log: InsertActivityLog) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(activityLogs).values(log).returning({ id: activityLogs.id });
  return result[0]?.id ?? null;
}

export async function getActivityLogs(limit: number = 100) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

export async function getActivityLogsByUserId(userId: number, limit: number = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activityLogs).where(eq(activityLogs.userId, userId)).orderBy(desc(activityLogs.createdAt)).limit(limit);
}

// ============ SITE SETTINGS QUERIES ============
export async function getSetting(key: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAllSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteSettings).orderBy(asc(siteSettings.key));
}

export async function setSetting(key: string, value: string, description?: string) {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(siteSettings).values({ key, value, description })
    .onConflictDoUpdate({
      target: siteSettings.key,
      set: {
        value,
        description: description ?? sql`${siteSettings.description}`,
        updatedAt: new Date(),
      },
    });
}

// ============ DASHBOARD STATS ============
export async function getDashboardStats() {
  const db = await getDb();
  if (!db) return {
    totalUsers: 0,
    totalOrders: 0,
    pendingOrders: 0,
    verifiedOrders: 0,
    totalRevenue: "0",
    activeCredentials: 0,
  };

  const [userCount] = await db.select({ count: sql<number>`count(*)` }).from(users);
  const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders);
  const [pendingCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "pending"));
  const [verifiedCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, "verified"));
  const [revenueSum] = await db.select({ sum: sql<string>`COALESCE(SUM(price), 0)` }).from(orders).where(eq(orders.status, "verified"));
  const [credentialCount] = await db.select({ count: sql<number>`count(*)` }).from(iptvCredentials).where(eq(iptvCredentials.isActive, true));

  return {
    totalUsers: Number(userCount?.count ?? 0),
    totalOrders: Number(orderCount?.count ?? 0),
    pendingOrders: Number(pendingCount?.count ?? 0),
    verifiedOrders: Number(verifiedCount?.count ?? 0),
    totalRevenue: revenueSum?.sum ?? "0",
    activeCredentials: Number(credentialCount?.count ?? 0),
  };
}
