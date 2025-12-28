ALTER TABLE `paymentWidgets` ADD `name` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentWidgets` ADD `minConnections` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentWidgets` ADD `maxConnections` int DEFAULT 10 NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentWidgets` DROP COLUMN `connections`;