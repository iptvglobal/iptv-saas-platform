ALTER TABLE `paymentWidgets` ADD `invoiceId` varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE `paymentWidgets` DROP COLUMN `widgetIframe`;