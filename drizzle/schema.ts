import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, bigint, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Minecraft servers table
 */
export const servers = mysqlTable("servers", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Owner of the server
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL-friendly name
  address: varchar("address", { length: 255 }).notNull().unique(), // [slug].spacehost.cloud
  port: int("port").notNull(), // Auto-generated port
  version: varchar("version", { length: 50 }).notNull(), // Minecraft version
  software: mysqlEnum("software", ["vanilla", "spigot", "paper", "forge", "fabric", "bedrock"]).notNull(),
  status: mysqlEnum("status", ["offline", "starting", "online", "stopping", "crashed"]).default("offline").notNull(),
  slots: int("slots").default(20).notNull(), // Max players
  difficulty: mysqlEnum("difficulty", ["peaceful", "easy", "normal", "hard"]).default("normal").notNull(),
  gamemode: mysqlEnum("gamemode", ["survival", "creative", "adventure", "spectator"]).default("survival").notNull(),
  worldType: varchar("worldType", { length: 50 }).default("default").notNull(),
  
  // Server settings
  pvpEnabled: boolean("pvpEnabled").default(true).notNull(),
  whitelistEnabled: boolean("whitelistEnabled").default(false).notNull(),
  crackedEnabled: boolean("crackedEnabled").default(false).notNull(),
  commandBlocksEnabled: boolean("commandBlocksEnabled").default(false).notNull(),
  netherEnabled: boolean("netherEnabled").default(true).notNull(),
  animalsEnabled: boolean("animalsEnabled").default(true).notNull(),
  monstersEnabled: boolean("monstersEnabled").default(true).notNull(),
  spawnProtection: int("spawnProtection").default(16).notNull(),
  forceGamemode: boolean("forceGamemode").default(false).notNull(),
  
  // Resource usage
  ramUsed: int("ramUsed").default(0).notNull(), // MB
  ramTotal: int("ramTotal").default(2048).notNull(), // MB
  storageUsed: bigint("storageUsed", { mode: "number" }).default(0).notNull(), // MB
  storageTotal: bigint("storageTotal", { mode: "number" }).default(10240).notNull(), // MB (10GB)
  
  // Timestamps
  lastStarted: timestamp("lastStarted"),
  lastStopped: timestamp("lastStopped"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  
  // Aternos integration
  aternosServerId: varchar("aternosServerId", { length: 255 }), // Aternos server ID if using API
});

export type Server = typeof servers.$inferSelect;
export type InsertServer = typeof servers.$inferInsert;

/**
 * Players on servers (whitelist, ops, bans)
 */
export const players = mysqlTable("players", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").notNull(),
  username: varchar("username", { length: 100 }).notNull(),
  uuid: varchar("uuid", { length: 36 }), // Minecraft UUID
  isWhitelisted: boolean("isWhitelisted").default(false).notNull(),
  isOperator: boolean("isOperator").default(false).notNull(),
  isBanned: boolean("isBanned").default(false).notNull(),
  banReason: text("banReason"),
  lastSeen: timestamp("lastSeen"),
  firstJoined: timestamp("firstJoined").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Player = typeof players.$inferSelect;
export type InsertPlayer = typeof players.$inferInsert;

/**
 * Server backups
 */
export const backups = mysqlTable("backups", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileUrl: text("fileUrl").notNull(), // S3 URL
  size: bigint("size", { mode: "number" }).notNull(), // Bytes
  type: mysqlEnum("type", ["manual", "automatic", "scheduled"]).default("manual").notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "failed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});

export type Backup = typeof backups.$inferSelect;
export type InsertBackup = typeof backups.$inferInsert;

/**
 * Server files metadata (for tracking uploads to S3)
 */
export const serverFiles = mysqlTable("server_files", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  filePath: varchar("filePath", { length: 500 }).notNull(), // Relative path in server
  fileKey: varchar("fileKey", { length: 500 }).notNull(), // S3 key
  fileUrl: text("fileUrl").notNull(), // S3 URL
  fileSize: bigint("fileSize", { mode: "number" }).notNull(), // Bytes
  mimeType: varchar("mimeType", { length: 100 }),
  fileType: mysqlEnum("fileType", ["world", "plugin", "mod", "config", "other"]).default("other").notNull(),
  uploadedBy: int("uploadedBy").notNull(), // User ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServerFile = typeof serverFiles.$inferSelect;
export type InsertServerFile = typeof serverFiles.$inferInsert;

/**
 * Server events log
 */
export const serverEvents = mysqlTable("server_events", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").notNull(),
  eventType: mysqlEnum("eventType", [
    "server_start", "server_stop", "server_crash", "server_restart",
    "player_join", "player_leave", "player_kick", "player_ban", "player_unban",
    "config_change", "backup_created", "backup_restored",
    "plugin_installed", "plugin_removed", "mod_installed", "mod_removed"
  ]).notNull(),
  eventData: json("eventData"), // Additional data (player name, config changed, etc)
  message: text("message"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ServerEvent = typeof serverEvents.$inferSelect;
export type InsertServerEvent = typeof serverEvents.$inferInsert;

/**
 * Console logs
 */
export const consoleLogs = mysqlTable("console_logs", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").notNull(),
  logLevel: mysqlEnum("logLevel", ["info", "warning", "error", "debug"]).default("info").notNull(),
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export type ConsoleLog = typeof consoleLogs.$inferSelect;
export type InsertConsoleLog = typeof consoleLogs.$inferInsert;

/**
 * Installed plugins/mods
 */
export const installedAddons = mysqlTable("installed_addons", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").notNull(),
  addonType: mysqlEnum("addonType", ["plugin", "mod"]).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull(),
  version: varchar("version", { length: 100 }).notNull(),
  author: varchar("author", { length: 255 }),
  description: text("description"),
  downloadUrl: text("downloadUrl"),
  fileKey: varchar("fileKey", { length: 500 }), // S3 key
  fileUrl: text("fileUrl"), // S3 URL
  source: mysqlEnum("source", ["curseforge", "modrinth", "manual"]).default("manual").notNull(),
  sourceId: varchar("sourceId", { length: 255 }), // ID from CurseForge/Modrinth
  installedAt: timestamp("installedAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type InstalledAddon = typeof installedAddons.$inferSelect;
export type InsertInstalledAddon = typeof installedAddons.$inferInsert;

/**
 * Server access sharing
 */
export const serverAccess = mysqlTable("server_access", {
  id: int("id").autoincrement().primaryKey(),
  serverId: int("serverId").notNull(),
  userId: int("userId").notNull(), // User who has access
  accessLevel: mysqlEnum("accessLevel", ["viewer", "editor", "admin"]).default("viewer").notNull(),
  grantedBy: int("grantedBy").notNull(), // User ID who granted access
  grantedAt: timestamp("grantedAt").defaultNow().notNull(),
  revokedAt: timestamp("revokedAt"),
});

export type ServerAccess = typeof serverAccess.$inferSelect;
export type InsertServerAccess = typeof serverAccess.$inferInsert;

/**
 * User notification preferences
 */
export const notificationPreferences = mysqlTable("notification_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  serverStart: boolean("serverStart").default(true).notNull(),
  serverStop: boolean("serverStop").default(true).notNull(),
  serverCrash: boolean("serverCrash").default(true).notNull(),
  playerJoin: boolean("playerJoin").default(false).notNull(),
  playerLeave: boolean("playerLeave").default(false).notNull(),
  backupCompleted: boolean("backupCompleted").default(true).notNull(),
  emailEnabled: boolean("emailEnabled").default(false).notNull(),
  inAppEnabled: boolean("inAppEnabled").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type NotificationPreference = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreference = typeof notificationPreferences.$inferInsert;

/**
 * In-app notifications
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  serverId: int("serverId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["info", "success", "warning", "error"]).default("info").notNull(),
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
