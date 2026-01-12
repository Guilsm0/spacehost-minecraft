import { eq, and, desc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  servers, InsertServer, Server,
  players, InsertPlayer, Player,
  backups, InsertBackup, Backup,
  serverFiles, InsertServerFile, ServerFile,
  serverEvents, InsertServerEvent, ServerEvent,
  consoleLogs, InsertConsoleLog, ConsoleLog,
  installedAddons, InsertInstalledAddon, InstalledAddon,
  serverAccess, InsertServerAccess, ServerAccess,
  notificationPreferences, InsertNotificationPreference, NotificationPreference,
  notifications, InsertNotification, Notification
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER OPERATIONS ============

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

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ SERVER OPERATIONS ============

export async function createServer(server: InsertServer): Promise<Server> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(servers).values(server);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(servers).where(eq(servers.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getServerById(serverId: number): Promise<Server | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(servers).where(eq(servers.id, serverId)).limit(1);
  return result[0];
}

export async function getServersByUserId(userId: number): Promise<Server[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(servers).where(eq(servers.userId, userId)).orderBy(desc(servers.createdAt));
}

export async function updateServer(serverId: number, updates: Partial<InsertServer>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(servers).set(updates).where(eq(servers.id, serverId));
}

export async function deleteServer(serverId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(servers).where(eq(servers.id, serverId));
}

export async function getServerBySlug(slug: string): Promise<Server | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(servers).where(eq(servers.slug, slug)).limit(1);
  return result[0];
}

// ============ PLAYER OPERATIONS ============

export async function addPlayer(player: InsertPlayer): Promise<Player> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(players).values(player);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(players).where(eq(players.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getPlayersByServerId(serverId: number): Promise<Player[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(players).where(eq(players.serverId, serverId)).orderBy(desc(players.lastSeen));
}

export async function updatePlayer(playerId: number, updates: Partial<InsertPlayer>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(players).set(updates).where(eq(players.id, playerId));
}

export async function deletePlayer(playerId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(players).where(eq(players.id, playerId));
}

export async function getPlayerByUsername(serverId: number, username: string): Promise<Player | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(players)
    .where(and(eq(players.serverId, serverId), eq(players.username, username)))
    .limit(1);
  return result[0];
}

// ============ BACKUP OPERATIONS ============

export async function createBackup(backup: InsertBackup): Promise<Backup> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(backups).values(backup);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(backups).where(eq(backups.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getBackupsByServerId(serverId: number): Promise<Backup[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(backups).where(eq(backups.serverId, serverId)).orderBy(desc(backups.createdAt));
}

export async function updateBackup(backupId: number, updates: Partial<InsertBackup>): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(backups).set(updates).where(eq(backups.id, backupId));
}

export async function deleteBackup(backupId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(backups).where(eq(backups.id, backupId));
}

// ============ SERVER FILE OPERATIONS ============

export async function createServerFile(file: InsertServerFile): Promise<ServerFile> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(serverFiles).values(file);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(serverFiles).where(eq(serverFiles.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getServerFilesByServerId(serverId: number): Promise<ServerFile[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(serverFiles).where(eq(serverFiles.serverId, serverId)).orderBy(desc(serverFiles.createdAt));
}

export async function deleteServerFile(fileId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(serverFiles).where(eq(serverFiles.id, fileId));
}

// ============ SERVER EVENT OPERATIONS ============

export async function logServerEvent(event: InsertServerEvent): Promise<ServerEvent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(serverEvents).values(event);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(serverEvents).where(eq(serverEvents.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getServerEventsByServerId(serverId: number, limit: number = 100): Promise<ServerEvent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(serverEvents)
    .where(eq(serverEvents.serverId, serverId))
    .orderBy(desc(serverEvents.createdAt))
    .limit(limit);
}

// ============ CONSOLE LOG OPERATIONS ============

export async function addConsoleLog(log: InsertConsoleLog): Promise<ConsoleLog> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(consoleLogs).values(log);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(consoleLogs).where(eq(consoleLogs.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getConsoleLogsByServerId(serverId: number, limit: number = 500): Promise<ConsoleLog[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(consoleLogs)
    .where(eq(consoleLogs.serverId, serverId))
    .orderBy(desc(consoleLogs.timestamp))
    .limit(limit);
}

// ============ INSTALLED ADDON OPERATIONS ============

export async function installAddon(addon: InsertInstalledAddon): Promise<InstalledAddon> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(installedAddons).values(addon);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(installedAddons).where(eq(installedAddons.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getInstalledAddonsByServerId(serverId: number): Promise<InstalledAddon[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(installedAddons)
    .where(eq(installedAddons.serverId, serverId))
    .orderBy(desc(installedAddons.installedAt));
}

export async function deleteInstalledAddon(addonId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(installedAddons).where(eq(installedAddons.id, addonId));
}

// ============ SERVER ACCESS OPERATIONS ============

export async function grantServerAccess(access: InsertServerAccess): Promise<ServerAccess> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(serverAccess).values(access);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(serverAccess).where(eq(serverAccess.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getServerAccessByServerId(serverId: number): Promise<ServerAccess[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(serverAccess)
    .where(and(eq(serverAccess.serverId, serverId), sql`${serverAccess.revokedAt} IS NULL`));
}

export async function revokeServerAccess(accessId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(serverAccess).set({ revokedAt: new Date() }).where(eq(serverAccess.id, accessId));
}

// ============ NOTIFICATION OPERATIONS ============

export async function getNotificationPreferences(userId: number): Promise<NotificationPreference | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return result[0];
}

export async function upsertNotificationPreferences(prefs: InsertNotificationPreference): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.insert(notificationPreferences).values(prefs).onDuplicateKeyUpdate({
    set: prefs,
  });
}

export async function createNotification(notification: InsertNotification): Promise<Notification> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(notifications).values(notification);
  const insertedId = Number(result[0].insertId);
  
  const created = await db.select().from(notifications).where(eq(notifications.id, insertedId)).limit(1);
  return created[0]!;
}

export async function getNotificationsByUserId(userId: number, limit: number = 50): Promise<Notification[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function markNotificationAsRead(notificationId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}
