CREATE TABLE `planPaymentMethods` (
	`id` int AUTO_INCREMENT NOT NULL,
	`planId` int NOT NULL,
	`paymentMethodId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `planPaymentMethods_id` PRIMARY KEY(`id`)
);
