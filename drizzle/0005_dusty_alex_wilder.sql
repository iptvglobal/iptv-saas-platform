DROP TABLE `planPaymentMethods`;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `planId` int NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `minConnections` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentMethods` ADD `maxConnections` int DEFAULT 10 NOT NULL;