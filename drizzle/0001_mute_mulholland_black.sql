CREATE TABLE `backups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`size` bigint NOT NULL,
	`type` enum('manual','automatic','scheduled') NOT NULL DEFAULT 'manual',
	`status` enum('pending','in_progress','completed','failed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	CONSTRAINT `backups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `console_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`logLevel` enum('info','warning','error','debug') NOT NULL DEFAULT 'info',
	`message` text NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `console_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `installed_addons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`addonType` enum('plugin','mod') NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`version` varchar(100) NOT NULL,
	`author` varchar(255),
	`description` text,
	`downloadUrl` text,
	`fileKey` varchar(500),
	`fileUrl` text,
	`source` enum('curseforge','modrinth','manual') NOT NULL DEFAULT 'manual',
	`sourceId` varchar(255),
	`installedAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `installed_addons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notification_preferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serverStart` boolean NOT NULL DEFAULT true,
	`serverStop` boolean NOT NULL DEFAULT true,
	`serverCrash` boolean NOT NULL DEFAULT true,
	`playerJoin` boolean NOT NULL DEFAULT false,
	`playerLeave` boolean NOT NULL DEFAULT false,
	`backupCompleted` boolean NOT NULL DEFAULT true,
	`emailEnabled` boolean NOT NULL DEFAULT false,
	`inAppEnabled` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `notification_preferences_id` PRIMARY KEY(`id`),
	CONSTRAINT `notification_preferences_userId_unique` UNIQUE(`userId`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`serverId` int,
	`title` varchar(255) NOT NULL,
	`message` text NOT NULL,
	`type` enum('info','success','warning','error') NOT NULL DEFAULT 'info',
	`isRead` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `players` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`username` varchar(100) NOT NULL,
	`uuid` varchar(36),
	`isWhitelisted` boolean NOT NULL DEFAULT false,
	`isOperator` boolean NOT NULL DEFAULT false,
	`isBanned` boolean NOT NULL DEFAULT false,
	`banReason` text,
	`lastSeen` timestamp,
	`firstJoined` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `players_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `server_access` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`userId` int NOT NULL,
	`accessLevel` enum('viewer','editor','admin') NOT NULL DEFAULT 'viewer',
	`grantedBy` int NOT NULL,
	`grantedAt` timestamp NOT NULL DEFAULT (now()),
	`revokedAt` timestamp,
	CONSTRAINT `server_access_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `server_events` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`eventType` enum('server_start','server_stop','server_crash','server_restart','player_join','player_leave','player_kick','player_ban','player_unban','config_change','backup_created','backup_restored','plugin_installed','plugin_removed','mod_installed','mod_removed') NOT NULL,
	`eventData` json,
	`message` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `server_events_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `server_files` (
	`id` int AUTO_INCREMENT NOT NULL,
	`serverId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`filePath` varchar(500) NOT NULL,
	`fileKey` varchar(500) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` bigint NOT NULL,
	`mimeType` varchar(100),
	`fileType` enum('world','plugin','mod','config','other') NOT NULL DEFAULT 'other',
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `server_files_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `servers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`slug` varchar(255) NOT NULL,
	`address` varchar(255) NOT NULL,
	`port` int NOT NULL,
	`version` varchar(50) NOT NULL,
	`software` enum('vanilla','spigot','paper','forge','fabric','bedrock') NOT NULL,
	`status` enum('offline','starting','online','stopping','crashed') NOT NULL DEFAULT 'offline',
	`slots` int NOT NULL DEFAULT 20,
	`difficulty` enum('peaceful','easy','normal','hard') NOT NULL DEFAULT 'normal',
	`gamemode` enum('survival','creative','adventure','spectator') NOT NULL DEFAULT 'survival',
	`worldType` varchar(50) NOT NULL DEFAULT 'default',
	`pvpEnabled` boolean NOT NULL DEFAULT true,
	`whitelistEnabled` boolean NOT NULL DEFAULT false,
	`crackedEnabled` boolean NOT NULL DEFAULT false,
	`commandBlocksEnabled` boolean NOT NULL DEFAULT false,
	`netherEnabled` boolean NOT NULL DEFAULT true,
	`animalsEnabled` boolean NOT NULL DEFAULT true,
	`monstersEnabled` boolean NOT NULL DEFAULT true,
	`spawnProtection` int NOT NULL DEFAULT 16,
	`forceGamemode` boolean NOT NULL DEFAULT false,
	`ramUsed` int NOT NULL DEFAULT 0,
	`ramTotal` int NOT NULL DEFAULT 2048,
	`storageUsed` bigint NOT NULL DEFAULT 0,
	`storageTotal` bigint NOT NULL DEFAULT 10240,
	`lastStarted` timestamp,
	`lastStopped` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`aternosServerId` varchar(255),
	CONSTRAINT `servers_id` PRIMARY KEY(`id`),
	CONSTRAINT `servers_slug_unique` UNIQUE(`slug`),
	CONSTRAINT `servers_address_unique` UNIQUE(`address`)
);
