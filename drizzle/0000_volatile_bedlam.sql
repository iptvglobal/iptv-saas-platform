CREATE TYPE "public"."chat_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."credential_type" AS ENUM('xtream', 'm3u', 'portal');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'verified', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."payment_method_type" AS ENUM('card', 'paypal', 'crypto', 'custom');--> statement-breakpoint
CREATE TYPE "public"."sender_role" AS ENUM('user', 'admin', 'agent');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin', 'agent');--> statement-breakpoint
CREATE TABLE "activityLogs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer,
	"action" varchar(100) NOT NULL,
	"entityType" varchar(50),
	"entityId" integer,
	"details" json,
	"ipAddress" varchar(45),
	"userAgent" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatConversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"subject" varchar(255),
	"status" "chat_status" DEFAULT 'open' NOT NULL,
	"lastMessageAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "chatMessages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversationId" integer NOT NULL,
	"senderId" integer NOT NULL,
	"senderRole" "sender_role" NOT NULL,
	"message" text NOT NULL,
	"isRead" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "emailTemplates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"subject" varchar(255) NOT NULL,
	"htmlContent" text NOT NULL,
	"textContent" text,
	"variables" json,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "emailTemplates_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "iptvCredentials" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"orderId" integer NOT NULL,
	"connectionNumber" integer NOT NULL,
	"credentialType" "credential_type" NOT NULL,
	"serverUrl" text,
	"username" varchar(255),
	"password" varchar(255),
	"m3uUrl" text,
	"epgUrl" text,
	"portalUrl" text,
	"macAddress" varchar(50),
	"expiresAt" timestamp,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"planId" integer NOT NULL,
	"connections" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"paymentMethodId" integer,
	"paymentWidgetId" integer,
	"paymentMethodName" varchar(255),
	"paymentMethodType" varchar(50),
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"paymentConfirmedAt" timestamp,
	"verifiedAt" timestamp,
	"verifiedBy" integer,
	"rejectedAt" timestamp,
	"rejectedBy" integer,
	"rejectionReason" text,
	"notes" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paymentMethods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "payment_method_type" NOT NULL,
	"planId" integer NOT NULL,
	"minConnections" integer DEFAULT 1 NOT NULL,
	"maxConnections" integer DEFAULT 10 NOT NULL,
	"instructions" text,
	"paymentLink" text,
	"iconUrl" text,
	"isActive" boolean DEFAULT true NOT NULL,
	"sortOrder" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "paymentWidgets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"planId" integer NOT NULL,
	"minConnections" integer DEFAULT 1 NOT NULL,
	"maxConnections" integer DEFAULT 10 NOT NULL,
	"invoiceId" varchar(255) NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "planPricing" (
	"id" serial PRIMARY KEY NOT NULL,
	"planId" integer NOT NULL,
	"connections" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"durationDays" integer DEFAULT 30 NOT NULL,
	"maxConnections" integer DEFAULT 10 NOT NULL,
	"isActive" boolean DEFAULT true NOT NULL,
	"features" json,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "siteSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(100) NOT NULL,
	"value" text,
	"description" text,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "siteSettings_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
