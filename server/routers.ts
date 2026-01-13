import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { sendOrderConfirmationEmail, sendCredentialsEmail, sendPaymentVerificationEmail, sendNewChatMessageEmail, sendAdminNewOrderEmail, sendTestEmail } from "./brevo";
import { runEmailDiagnostic } from "./emailDiagnostic";

// Admin procedure - only allows admin role
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

// Staff procedure - allows admin and agent roles
const staffProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "agent") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Staff access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ USER MANAGEMENT ============
  users: router({
    list: adminProcedure.query(async () => {
      return db.getAllUsers();
    }),
    
    getById: adminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getUserById(input.id);
      }),
    
    updateRole: adminProcedure
      .input(z.object({ 
        userId: z.number(), 
        role: z.enum(["user", "admin", "agent"]) 
      }))
      .mutation(async ({ input, ctx }) => {
        await db.updateUserRole(input.userId, input.role);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "update_user_role",
          entityType: "user",
          entityId: input.userId,
          details: { newRole: input.role },
        });
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ userId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (input.userId === ctx.user.id) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Cannot delete yourself" });
        }
        await db.deleteUser(input.userId);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "delete_user",
          entityType: "user",
          entityId: input.userId,
        });
        return { success: true };
      }),
  }),

  // ============ PLANS MANAGEMENT ============
  plans: router({
    list: publicProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        const plans = await db.getAllPlans(input?.activeOnly ?? false);
        const allPricing = await db.getAllPlanPricing();
        
        return plans.map(plan => ({
          ...plan,
          pricing: allPricing.filter(p => p.planId === plan.id),
        }));
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const plan = await db.getPlanById(input.id);
        if (!plan) return null;
        const pricing = await db.getPlanPricing(input.id);
        return { ...plan, pricing };
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        durationDays: z.number().min(1).default(30),
        maxConnections: z.number().min(1).max(10).default(10),
        isActive: z.boolean().default(true),
        features: z.array(z.string()).optional(),
        promoText: z.string().optional().nullable(),
        pricing: z.array(z.object({
          connections: z.number().min(1).max(10),
          price: z.string(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { pricing, ...planData } = input;
        const planId = await db.createPlan(planData);
        if (planId && pricing.length > 0) {
          await db.setPlanPricing(planId, pricing);
        }
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "create_plan",
          entityType: "plan",
          entityId: planId || undefined,
          details: { name: input.name },
        });
        return { success: true, planId };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        durationDays: z.number().min(1).optional(),
        maxConnections: z.number().min(1).max(10).optional(),
        isActive: z.boolean().optional(),
        features: z.array(z.string()).optional(),
        promoText: z.string().optional().nullable(),
        pricing: z.array(z.object({
          connections: z.number().min(1).max(10),
          price: z.string(),
        })).optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, pricing, ...planData } = input;
        await db.updatePlan(id, planData);
        if (pricing) {
          await db.setPlanPricing(id, pricing);
        }
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "update_plan",
          entityType: "plan",
          entityId: id,
        });
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deletePlan(input.id);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "delete_plan",
          entityType: "plan",
          entityId: input.id,
        });
        return { success: true };
      }),
  }),

  // ============ PAYMENT WIDGETS (NowPayments) ============
  paymentWidgets: router({
    list: adminProcedure.query(async () => {
      return db.getAllPaymentWidgets();
    }),
    
    getForPlan: publicProcedure
      .input(z.object({ planId: z.number(), connections: z.number() }))
      .query(async ({ input }) => {
        return db.getPaymentWidgetForPlan(input.planId, input.connections);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        planId: z.number(),
        minConnections: z.number().min(1).max(10).default(1),
        maxConnections: z.number().min(1).max(10).default(10),
        invoiceId: z.string().min(1), // NowPayments invoice ID (iid parameter)
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createPaymentWidget(input);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "create_payment_widget",
          entityType: "payment_widget",
          entityId: id || undefined,
        });
        return { success: true, id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        planId: z.number().optional(),
        minConnections: z.number().min(1).max(10).optional(),
        maxConnections: z.number().min(1).max(10).optional(),
        invoiceId: z.string().optional(), // NowPayments invoice ID (iid parameter)
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updatePaymentWidget(id, data);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "update_payment_widget",
          entityType: "payment_widget",
          entityId: id,
        });
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deletePaymentWidget(input.id);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "delete_payment_widget",
          entityType: "payment_widget",
          entityId: input.id,
        });
        return { success: true };
      }),
  }),

  // ============ PAYMENT METHODS ============
  paymentMethods: router({
    list: publicProcedure
      .input(z.object({ activeOnly: z.boolean().optional() }).optional())
      .query(async ({ input }) => {
        return db.getAllPaymentMethods(input?.activeOnly ?? false);
      }),
    
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getPaymentMethodById(input.id);
      }),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        type: z.enum(["card", "paypal", "crypto", "custom"]),
        planId: z.number(),
        minConnections: z.number().min(1).max(10).default(1),
        maxConnections: z.number().min(1).max(10).default(10),
        instructions: z.string().optional(),
        paymentLink: z.string().optional(),
        iconUrl: z.string().optional(),
        isActive: z.boolean().default(true),
        sortOrder: z.number().default(0),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createPaymentMethod(input);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "create_payment_method",
          entityType: "payment_method",
          entityId: id || undefined,
          details: { name: input.name, planId: input.planId },
        });
        return { success: true, id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        type: z.enum(["card", "paypal", "crypto", "custom"]).optional(),
        planId: z.number().optional(),
        minConnections: z.number().min(1).max(10).optional(),
        maxConnections: z.number().min(1).max(10).optional(),
        instructions: z.string().optional(),
        paymentLink: z.string().optional(),
        iconUrl: z.string().optional(),
        isActive: z.boolean().optional(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updatePaymentMethod(id, data);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "update_payment_method",
          entityType: "payment_method",
          entityId: id,
        });
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deletePaymentMethod(input.id);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "delete_payment_method",
          entityType: "payment_method",
          entityId: input.id,
        });
        return { success: true };
      }),
    
    getForPlan: publicProcedure
      .input(z.object({ planId: z.number(), connections: z.number() }))
      .query(async ({ input }) => {
        return db.getPaymentMethodsForPlan(input.planId, input.connections);
      }),
  }),

  // ============ ORDERS ============
  orders: router({
    list: staffProcedure
      .input(z.object({ status: z.enum(["pending", "verified", "rejected"]).optional() }).optional())
      .query(async ({ input }) => {
        if (input?.status) {
          return db.getOrdersByStatus(input.status);
        }
        return db.getAllOrders();
      }),
    
    myOrders: protectedProcedure.query(async ({ ctx }) => {
      return db.getOrdersByUserId(ctx.user.id);
    }),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.id);
        if (!order) return null;
        // Users can only see their own orders, staff can see all
        if (order.userId !== ctx.user.id && ctx.user.role === "user") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return order;
      }),
    
    create: protectedProcedure
      .input(z.object({
        planId: z.number(),
        connections: z.number().min(1).max(10),
        price: z.string(),
        paymentMethodId: z.number().optional(),
        paymentWidgetId: z.number().optional(),
        paymentMethodName: z.string().optional(),
        paymentMethodType: z.string().optional(),
        credentialsType: z.enum(["xtream", "mag", "m3u", "enigma2"]).optional(),
        macAddress: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const orderId = await db.createOrder({
          userId: ctx.user.id,
          ...input,
        });
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "create_order",
          entityType: "order",
          entityId: orderId || undefined,
          details: { 
            planId: input.planId, 
            connections: input.connections,
            credentialsType: input.credentialsType,
            macAddress: input.credentialsType === "mag" ? input.macAddress : undefined
          },
        });
        
        // Send order confirmation email to user
        try {
          const plan = await db.getPlanById(input.planId);
          if (ctx.user.email) {
            await sendOrderConfirmationEmail({
              to: ctx.user.email,
              userName: ctx.user.name || 'Customer',
              orderId: orderId || 0,
              planName: plan?.name || 'Unknown Plan',
              connections: input.connections,
              price: input.price,
              paymentMethod: input.paymentMethodName || 'Not specified',
            });
          }
          
          // Send admin notification email
          await sendAdminNewOrderEmail({
            orderId: orderId || 0,
            userEmail: ctx.user.email || 'Unknown',
            planName: plan?.name || 'Unknown Plan',
            connections: input.connections,
            price: input.price,
            paymentMethod: input.paymentMethodName || 'Not specified',
          });
        } catch (emailError) {
          console.error('Failed to send order emails:', emailError);
          // Don't fail the order creation if email fails
        }
        
        return { success: true, orderId };
      }),
    
    confirmPayment: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
        }
        if (order.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        await db.updateOrder(input.orderId, {
          paymentConfirmedAt: new Date(),
        });
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "confirm_payment",
          entityType: "order",
          entityId: input.orderId,
        });
        return { success: true };
      }),
    
    verify: staffProcedure
      .input(z.object({ orderId: z.number(), notes: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateOrder(input.orderId, {
          status: "verified",
          verifiedAt: new Date(),
          verifiedBy: ctx.user.id,
          notes: input.notes,
        });
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "verify_order",
          entityType: "order",
          entityId: input.orderId,
        });
        
        // Send payment verification email
        try {
          const order = await db.getOrderById(input.orderId);
          if (order) {
            const user = await db.getUserById(order.userId);
            const plan = await db.getPlanById(order.planId);
            if (user?.email) {
              await sendPaymentVerificationEmail({
                to: user.email,
                userName: user.name || 'Customer',
                orderId: input.orderId,
                planName: plan?.name || 'Unknown Plan',
                status: 'verified',
              });
            }
          }
        } catch (emailError) {
          console.error('Failed to send verification email:', emailError);
        }
        
        return { success: true };
      }),
    
    reject: staffProcedure
      .input(z.object({ orderId: z.number(), reason: z.string() }))
      .mutation(async ({ input, ctx }) => {
        await db.updateOrder(input.orderId, {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: ctx.user.id,
          rejectionReason: input.reason,
        });
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "reject_order",
          entityType: "order",
          entityId: input.orderId,
          details: { reason: input.reason },
        });
        
        // Send payment rejection email
        try {
          const order = await db.getOrderById(input.orderId);
          if (order) {
            const user = await db.getUserById(order.userId);
            const plan = await db.getPlanById(order.planId);
            if (user?.email) {
              await sendPaymentVerificationEmail({
                to: user.email,
                userName: user.name || 'Customer',
                orderId: input.orderId,
                planName: plan?.name || 'Unknown Plan',
                status: 'rejected',
              });
            }
          }
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError);
        }
        
        return { success: true };
      }),
  }),

  // ============ IPTV CREDENTIALS ============
  credentials: router({
    list: adminProcedure.query(async () => {
      return db.getAllCredentials();
    }),
    
    myCredentials: protectedProcedure.query(async ({ ctx }) => {
      return db.getCredentialsByUserId(ctx.user.id);
    }),
    
    getByOrder: protectedProcedure
      .input(z.object({ orderId: z.number() }))
      .query(async ({ input, ctx }) => {
        const order = await db.getOrderById(input.orderId);
        if (!order) return [];
        if (order.userId !== ctx.user.id && ctx.user.role === "user") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return db.getCredentialsByOrderId(input.orderId);
      }),
    
    create: adminProcedure
      .input(z.object({
        userId: z.number(),
        orderId: z.number(),
        connectionNumber: z.number().min(1).max(10),
        credentialType: z.enum(["xtream", "m3u", "portal", "combined"]),
        serverUrl: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        m3uUrl: z.string().optional(),
        epgUrl: z.string().optional(),
        portalUrl: z.string().optional(),
        macAddress: z.string().optional(),
        expiresAt: z.date().optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createIptvCredential(input);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "create_credential",
          entityType: "credential",
          entityId: id || undefined,
          details: { orderId: input.orderId, connectionNumber: input.connectionNumber },
        });
        
        // Send credentials delivery email
        try {
          const user = await db.getUserById(input.userId);
          if (user?.email) {
            await sendCredentialsEmail(user.email, {
              type: input.credentialType,
              username: input.username,
              password: input.password,
              url: input.serverUrl,
              m3uUrl: input.m3uUrl,
              epgUrl: input.epgUrl,
              portalUrl: input.portalUrl,
              macAddress: input.macAddress,
              expiresAt: input.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
          }
        } catch (emailError) {
          console.error('Failed to send credentials email:', emailError);
          // Don't fail the credential creation if email fails
        }
        
        return { success: true, id };
      }),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        credentialType: z.enum(["xtream", "m3u", "portal", "combined"]).optional(),
        serverUrl: z.string().optional(),
        username: z.string().optional(),
        password: z.string().optional(),
        m3uUrl: z.string().optional(),
        epgUrl: z.string().optional(),
        portalUrl: z.string().optional(),
        macAddress: z.string().optional(),
        expiresAt: z.date().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...data } = input;
        await db.updateIptvCredential(id, data);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "update_credential",
          entityType: "credential",
          entityId: id,
        });
        return { success: true };
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await db.deleteIptvCredential(input.id);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "delete_credential",
          entityType: "credential",
          entityId: input.id,
        });
        return { success: true };
      }),
  }),

  // ============ CHAT ============
  chat: router({
    listConversations: staffProcedure.query(async () => {
      return db.getAllConversations();
    }),
    
    myConversations: protectedProcedure.query(async ({ ctx }) => {
      return db.getConversationsByUserId(ctx.user.id);
    }),
    
    getConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.id);
        if (!conversation) return null;
        if (conversation.userId !== ctx.user.id && ctx.user.role === "user") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        return conversation;
      }),
    
    createConversation: protectedProcedure
      .input(z.object({ subject: z.string().optional() }))
      .mutation(async ({ input, ctx }) => {
        const id = await db.createConversation({
          userId: ctx.user.id,
          subject: input.subject,
        });
        return { success: true, id };
      }),
    
    closeConversation: staffProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await db.updateConversation(input.id, { status: "closed" });
        return { success: true };
      }),
    
    getMessages: protectedProcedure
      .input(z.object({ conversationId: z.number() }))
      .query(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) return [];
        if (conversation.userId !== ctx.user.id && ctx.user.role === "user") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        // Mark messages as read based on who is viewing
        await db.markMessagesAsRead(input.conversationId, ctx.user.id, ctx.user.role);
        return db.getMessagesByConversationId(input.conversationId);
      }),
    
    sendMessage: protectedProcedure
      .input(z.object({
        conversationId: z.number(),
        content: z.string().min(1),
      }))
      .mutation(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(input.conversationId);
        if (!conversation) {
          throw new TRPCError({ code: "NOT_FOUND" });
        }
        if (conversation.userId !== ctx.user.id && ctx.user.role === "user") {
          throw new TRPCError({ code: "FORBIDDEN" });
        }
        const id = await db.createMessage({
          conversationId: input.conversationId,
          senderId: ctx.user.id,
          senderRole: ctx.user.role,
          message: input.content,
        });

        // --- NEW EMAIL NOTIFICATION LOGIC ---
        try {
            const senderName = ctx.user.name || 'Support';
            const messagePreview = input.content.substring(0, 100) + (input.content.length > 100 ? '...' : '');

            if (ctx.user.role === 'user') {
                // User sent a message, notify admin/staff
                const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
                if (adminEmail) {
                    await sendNewChatMessageEmail({
                        to: adminEmail,
                        senderName: ctx.user.name || 'User',
                        messagePreview: messagePreview,
                    });
                }
            } else {
                // Admin/Agent sent a message, notify the user
                const user = await db.getUserById(conversation.userId);
                if (user && user.email) {
                    await sendNewChatMessageEmail({
                        to: user.email,
                        senderName: senderName,
                        messagePreview: messagePreview,
                    });
                }
            }
        } catch (emailError) {
            console.error('Failed to send new chat message email:', emailError);
            // Do not block the chat message if email fails
        }
        // --- END NEW EMAIL NOTIFICATION LOGIC ---

        return { success: true, id };
      }),

    // Get unread message counts for user's conversations (messages from staff)
    getUnreadCounts: protectedProcedure.query(async ({ ctx }) => {
      return db.getUnreadCountsForUser(ctx.user.id);
    }),

    // Get unread message counts for admin (messages from users)
    getAdminUnreadCounts: staffProcedure.query(async () => {
      return db.getUnreadCountsForAdmin();
    }),
  }),

  // ============ EMAIL TEMPLATES ============
  emailTemplates: router({
    list: adminProcedure.query(async () => {
      return db.getAllEmailTemplates();
    }),
    
    getByName: adminProcedure
      .input(z.object({ name: z.string() }))
      .query(async ({ input }) => {
        return db.getEmailTemplate(input.name);
      }),
    
    upsert: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        subject: z.string().min(1),
        htmlContent: z.string().min(1),
        textContent: z.string().optional(),
        variables: z.array(z.string()).optional(),
        isActive: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertEmailTemplate(input);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "upsert_email_template",
          entityType: "email_template",
          details: { name: input.name },
        });
        return { success: true };
      }),
  }),

  // ============ ACTIVITY LOGS ============
  activityLogs: router({
    list: adminProcedure
      .input(z.object({ limit: z.number().min(1).max(500).default(100) }).optional())
      .query(async ({ input }) => {
        return db.getActivityLogs(input?.limit ?? 100);
      }),
    
    byUser: adminProcedure
      .input(z.object({ userId: z.number(), limit: z.number().min(1).max(100).default(50) }))
      .query(async ({ input }) => {
        return db.getActivityLogsByUserId(input.userId, input.limit);
      }),
  }),

  // ============ SITE SETTINGS ============
  settings: router({
    list: adminProcedure.query(async () => {
      return db.getAllSettings();
    }),
    
    get: adminProcedure
      .input(z.object({ key: z.string() }))
      .query(async ({ input }) => {
        return db.getSetting(input.key);
      }),
    
    set: adminProcedure
      .input(z.object({
        key: z.string().min(1),
        value: z.string(),
        description: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.setSetting(input.key, input.value, input.description);
        await db.createActivityLog({
          userId: ctx.user.id,
          action: "update_setting",
          entityType: "setting",
          details: { key: input.key },
        });
        return { success: true };
      }),
  }),

  // ============ DASHBOARD STATS ============
  dashboard: router({
    stats: adminProcedure.query(async () => {
      return db.getDashboardStats();
    }),
  }),

  // ============ EMAIL DIAGNOSTICS ============
  email: router({
    diagnostic: adminProcedure.query(async () => {
      return runEmailDiagnostic();
    }),
    
    sendTest: adminProcedure
      .input(z.object({ to: z.string().email() }))
      .mutation(async ({ input }) => {
        const result = await sendTestEmail(input.to);
        return result;
      }),
  }),
});

export type AppRouter = typeof appRouter;
