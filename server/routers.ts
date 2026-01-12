import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";

// Helper function to generate unique slug
function generateSlug(name: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${randomSuffix}`;
}

// Helper function to generate random port
function generatePort(): number {
  return Math.floor(Math.random() * 10000) + 25565; // 25565-35565
}

// Helper function to generate world seed
function generateWorldSeed(): string {
  return Math.floor(Math.random() * 9223372036854775807).toString();
}

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

  servers: router({
    // List user's servers
    list: protectedProcedure.query(async ({ ctx }) => {
      return await db.getServersByUserId(ctx.user.id);
    }),

    // Get server by ID
    get: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Servidor não encontrado' });
        }
        if (server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }
        return server;
      }),

    // Create new server
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(3).max(255),
        version: z.string(),
        software: z.enum(["vanilla", "spigot", "paper", "forge", "fabric", "bedrock"]),
        slots: z.number().min(1).max(100).default(20),
        difficulty: z.enum(["peaceful", "easy", "normal", "hard"]).default("normal"),
        gamemode: z.enum(["survival", "creative", "adventure", "spectator"]).default("survival"),
        worldType: z.string().default("default"),
        pvpEnabled: z.boolean().default(true),
        whitelistEnabled: z.boolean().default(false),
        crackedEnabled: z.boolean().default(false),
        commandBlocksEnabled: z.boolean().default(false),
        netherEnabled: z.boolean().default(true),
        animalsEnabled: z.boolean().default(true),
        monstersEnabled: z.boolean().default(true),
        spawnProtection: z.number().default(16),
        forceGamemode: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        // Check server limit (5 per user)
        const userServers = await db.getServersByUserId(ctx.user.id);
        if (userServers.length >= 5) {
          throw new TRPCError({ 
            code: 'BAD_REQUEST', 
            message: 'Limite de 5 servidores atingido. Exclua um servidor para criar outro.' 
          });
        }

        const slug = generateSlug(input.name);
        const port = generatePort();
        const address = `${slug}.spacehost.cloud`;

        const server = await db.createServer({
          userId: ctx.user.id,
          name: input.name,
          slug,
          address,
          port,
          version: input.version,
          software: input.software,
          slots: input.slots,
          difficulty: input.difficulty,
          gamemode: input.gamemode,
          worldType: input.worldType,
          pvpEnabled: input.pvpEnabled,
          whitelistEnabled: input.whitelistEnabled,
          crackedEnabled: input.crackedEnabled,
          commandBlocksEnabled: input.commandBlocksEnabled,
          netherEnabled: input.netherEnabled,
          animalsEnabled: input.animalsEnabled,
          monstersEnabled: input.monstersEnabled,
          spawnProtection: input.spawnProtection,
          forceGamemode: input.forceGamemode,
          status: "offline",
        });

        // Log creation event
        await db.logServerEvent({
          serverId: server.id,
          eventType: "server_start",
          message: `Servidor "${server.name}" criado`,
        });

        return server;
      }),

    // Update server settings
    update: protectedProcedure
      .input(z.object({
        serverId: z.number(),
        name: z.string().min(3).max(255).optional(),
        slots: z.number().min(1).max(100).optional(),
        difficulty: z.enum(["peaceful", "easy", "normal", "hard"]).optional(),
        gamemode: z.enum(["survival", "creative", "adventure", "spectator"]).optional(),
        pvpEnabled: z.boolean().optional(),
        whitelistEnabled: z.boolean().optional(),
        crackedEnabled: z.boolean().optional(),
        commandBlocksEnabled: z.boolean().optional(),
        netherEnabled: z.boolean().optional(),
        animalsEnabled: z.boolean().optional(),
        monstersEnabled: z.boolean().optional(),
        spawnProtection: z.number().optional(),
        forceGamemode: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { serverId, ...updates } = input;
        const server = await db.getServerById(serverId);
        
        if (!server) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Servidor não encontrado' });
        }
        if (server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }

        await db.updateServer(serverId, updates);
        
        // Log config change
        await db.logServerEvent({
          serverId,
          eventType: "config_change",
          eventData: updates,
          message: "Configurações do servidor atualizadas",
        });

        return { success: true };
      }),

    // Delete server
    delete: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        
        if (!server) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Servidor não encontrado' });
        }
        if (server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }

        await db.deleteServer(input.serverId);
        return { success: true };
      }),

    // Start server
    start: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        
        if (!server) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Servidor não encontrado' });
        }
        if (server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }

        if (server.status === 'online') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Servidor já está online' });
        }

        await db.updateServer(input.serverId, {
          status: 'starting',
          lastStarted: new Date(),
        });

        // Simulate server start (in real implementation, call Aternos API)
        setTimeout(async () => {
          await db.updateServer(input.serverId, { status: 'online' });
          await db.logServerEvent({
            serverId: input.serverId,
            eventType: 'server_start',
            message: 'Servidor iniciado com sucesso',
          });
        }, 3000);

        return { success: true, message: 'Servidor iniciando...' };
      }),

    // Stop server
    stop: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        
        if (!server) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Servidor não encontrado' });
        }
        if (server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }

        if (server.status === 'offline') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Servidor já está offline' });
        }

        await db.updateServer(input.serverId, {
          status: 'stopping',
          lastStopped: new Date(),
        });

        // Simulate server stop
        setTimeout(async () => {
          await db.updateServer(input.serverId, { status: 'offline' });
          await db.logServerEvent({
            serverId: input.serverId,
            eventType: 'server_stop',
            message: 'Servidor parado',
          });
        }, 2000);

        return { success: true, message: 'Servidor parando...' };
      }),

    // Restart server
    restart: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        
        if (!server) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Servidor não encontrado' });
        }
        if (server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'Acesso negado' });
        }

        await db.updateServer(input.serverId, { status: 'stopping' });

        // Simulate restart
        setTimeout(async () => {
          await db.updateServer(input.serverId, { status: 'starting' });
          setTimeout(async () => {
            await db.updateServer(input.serverId, { status: 'online', lastStarted: new Date() });
            await db.logServerEvent({
              serverId: input.serverId,
              eventType: 'server_restart',
              message: 'Servidor reiniciado',
            });
          }, 3000);
        }, 2000);

        return { success: true, message: 'Servidor reiniciando...' };
      }),
  }),

  console: router({
    // Get console logs
    getLogs: protectedProcedure
      .input(z.object({ serverId: z.number(), limit: z.number().default(500) }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getConsoleLogsByServerId(input.serverId, input.limit);
      }),

    // Execute command
    executeCommand: protectedProcedure
      .input(z.object({ serverId: z.number(), command: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        if (server.status !== 'online') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Servidor deve estar online' });
        }

        // Log command execution
        await db.addConsoleLog({
          serverId: input.serverId,
          logLevel: 'info',
          message: `> ${input.command}`,
        });

        // Simulate command response
        await db.addConsoleLog({
          serverId: input.serverId,
          logLevel: 'info',
          message: `Comando executado: ${input.command}`,
        });

        return { success: true };
      }),
  }),

  players: router({
    // List players
    list: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getPlayersByServerId(input.serverId);
      }),

    // Add player
    add: protectedProcedure
      .input(z.object({
        serverId: z.number(),
        username: z.string(),
        isWhitelisted: z.boolean().default(false),
        isOperator: z.boolean().default(false),
      }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // Check if player already exists
        const existing = await db.getPlayerByUsername(input.serverId, input.username);
        if (existing) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Jogador já existe' });
        }

        const player = await db.addPlayer(input);
        return player;
      }),

    // Update player
    update: protectedProcedure
      .input(z.object({
        playerId: z.number(),
        isWhitelisted: z.boolean().optional(),
        isOperator: z.boolean().optional(),
        isBanned: z.boolean().optional(),
        banReason: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { playerId, ...updates } = input;
        await db.updatePlayer(playerId, updates);
        return { success: true };
      }),

    // Remove player
    remove: protectedProcedure
      .input(z.object({ playerId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deletePlayer(input.playerId);
        return { success: true };
      }),
  }),

  backups: router({
    // List backups
    list: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getBackupsByServerId(input.serverId);
      }),

    // Create backup
    create: protectedProcedure
      .input(z.object({
        serverId: z.number(),
        name: z.string(),
        type: z.enum(["manual", "automatic", "scheduled"]).default("manual"),
      }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        // Create backup entry
        const backup = await db.createBackup({
          serverId: input.serverId,
          name: input.name,
          fileKey: `backups/${server.slug}/${Date.now()}.zip`,
          fileUrl: `https://storage.spacehost.cloud/backups/${server.slug}/${Date.now()}.zip`,
          size: 0,
          type: input.type,
          status: 'in_progress',
        });

        // Simulate backup creation
        setTimeout(async () => {
          await db.updateBackup(backup.id, {
            status: 'completed',
            size: Math.floor(Math.random() * 500000000), // Random size
            completedAt: new Date(),
          });

          await db.logServerEvent({
            serverId: input.serverId,
            eventType: 'backup_created',
            message: `Backup "${input.name}" criado com sucesso`,
          });
        }, 5000);

        return backup;
      }),

    // Delete backup
    delete: protectedProcedure
      .input(z.object({ backupId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteBackup(input.backupId);
        return { success: true };
      }),
  }),

  files: router({
    // List files
    list: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getServerFilesByServerId(input.serverId);
      }),

    // Delete file
    delete: protectedProcedure
      .input(z.object({ fileId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteServerFile(input.fileId);
        return { success: true };
      }),
  }),

  addons: router({
    // List installed addons
    list: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getInstalledAddonsByServerId(input.serverId);
      }),

    // Uninstall addon
    uninstall: protectedProcedure
      .input(z.object({ addonId: z.number() }))
      .mutation(async ({ input }) => {
        await db.deleteInstalledAddon(input.addonId);
        return { success: true };
      }),
  }),

  events: router({
    // Get server events
    list: protectedProcedure
      .input(z.object({ serverId: z.number(), limit: z.number().default(100) }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getServerEventsByServerId(input.serverId, input.limit);
      }),
  }),

  notifications: router({
    // Get user notifications
    list: protectedProcedure
      .input(z.object({ limit: z.number().default(50) }))
      .query(async ({ ctx, input }) => {
        return await db.getNotificationsByUserId(ctx.user.id, input.limit);
      }),

    // Mark as read
    markAsRead: protectedProcedure
      .input(z.object({ notificationId: z.number() }))
      .mutation(async ({ input }) => {
        await db.markNotificationAsRead(input.notificationId);
        return { success: true };
      }),

    // Mark all as read
    markAllAsRead: protectedProcedure
      .mutation(async ({ ctx }) => {
        await db.markAllNotificationsAsRead(ctx.user.id);
        return { success: true };
      }),

    // Get preferences
    getPreferences: protectedProcedure
      .query(async ({ ctx }) => {
        const prefs = await db.getNotificationPreferences(ctx.user.id);
        if (!prefs) {
          // Return defaults
          return {
            userId: ctx.user.id,
            serverStart: true,
            serverStop: true,
            serverCrash: true,
            playerJoin: false,
            playerLeave: false,
            backupCompleted: true,
            emailEnabled: false,
            inAppEnabled: true,
          };
        }
        return prefs;
      }),

    // Update preferences
    updatePreferences: protectedProcedure
      .input(z.object({
        serverStart: z.boolean().optional(),
        serverStop: z.boolean().optional(),
        serverCrash: z.boolean().optional(),
        playerJoin: z.boolean().optional(),
        playerLeave: z.boolean().optional(),
        backupCompleted: z.boolean().optional(),
        emailEnabled: z.boolean().optional(),
        inAppEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        await db.upsertNotificationPreferences({
          userId: ctx.user.id,
          ...input,
        });
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
