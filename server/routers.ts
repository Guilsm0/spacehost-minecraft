import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { TRPCError } from "@trpc/server";
import * as worldFileManager from "./world-file-manager";
import * as worldGeneratorApi from "./world-generator-api";
import { storagePut, storageGet } from "./storage";
import { promises as fs } from "fs";
import * as path from "path";

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

const WORLD_GENERATOR_JAR = path.join(__dirname, "../WorldGeneratorApi.jar");
const SERVERS_DATA_PATH = path.join(__dirname, "../servers-data");

// Ensure servers data directory exists
fs.mkdir(SERVERS_DATA_PATH, { recursive: true }).catch(console.error);

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

  worlds: router({
    // List worlds for a server
    list: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getWorldsByServerId(input.serverId);
      }),

    // Get active world
    getActive: protectedProcedure
      .input(z.object({ serverId: z.number() }))
      .query(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }
        return await db.getActiveWorldByServerId(input.serverId);
      }),

    // Generate new world with WorldGeneratorApi
    generate: protectedProcedure
      .input(z.object({
        serverId: z.number(),
        name: z.string().min(1).max(255),
        worldType: z.enum(["default", "flat", "large_biomes", "amplified"]).default("default"),
        seed: z.string().optional(),
        difficulty: z.enum(["peaceful", "easy", "normal", "hard"]).default("normal"),
        pvp: z.boolean().default(true),
        spawnProtection: z.number().default(16),
        commandBlocks: z.boolean().default(false),
        netherEnabled: z.boolean().default(true),
      }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        try {
          const worldPath = path.join(SERVERS_DATA_PATH, server.slug, "worlds", input.name);
          await fs.mkdir(worldPath, { recursive: true });

          // Generate world using WorldGeneratorApi
          const config = {
            name: input.name,
            seed: input.seed || worldGeneratorApi.generateRandomSeed(),
            worldType: input.worldType,
            difficulty: input.difficulty,
            pvp: input.pvp,
            spawnProtection: input.spawnProtection,
            commandBlocks: input.commandBlocks,
            netherEnabled: input.netherEnabled,
          };

          // Try to use WorldGeneratorApi if available
          try {
            await worldGeneratorApi.generateWorldWithApi(WORLD_GENERATOR_JAR, worldPath, config);
          } catch (error) {
            console.warn("WorldGeneratorApi not available, creating basic world structure");
            // Fallback: create basic world structure
            await fs.mkdir(path.join(worldPath, "region"), { recursive: true });
            await fs.mkdir(path.join(worldPath, "playerdata"), { recursive: true });
            await worldGeneratorApi.createLevelDat(worldPath, config);
          }

          // Validate world structure
          const isValid = await worldFileManager.validateWorldStructure(worldPath);
          if (!isValid) {
            throw new Error("Mundo gerado não passou na validação");
          }

          // Get world size
          const size = await worldGeneratorApi.getDirectorySize(worldPath);

          // Create world record in database
          const world = await db.createWorld({
            serverId: input.serverId,
            name: input.name,
            worldPath,
            size,
            worldType: input.worldType,
            seed: config.seed,
            difficulty: input.difficulty,
            isActive: true,
            isBackup: false,
          });

          // Log event
          await db.logServerEvent({
            serverId: input.serverId,
            eventType: "config_change",
            message: `Mundo "${input.name}" gerado com sucesso`,
          });

          return world;
        } catch (error) {
          console.error("Erro ao gerar mundo:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Erro ao gerar mundo: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }),

    // Upload world file (.world or .zip)
    upload: protectedProcedure
      .input(z.object({
        serverId: z.number(),
        fileName: z.string(),
        fileData: z.instanceof(Buffer),
      }))
      .mutation(async ({ input, ctx }) => {
        const server = await db.getServerById(input.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        try {
          // Validate file extension
          if (!worldFileManager.isValidWorldFile(input.fileName)) {
            throw new Error("Arquivo deve ser .world ou .zip");
          }

          // Create temp directory for extraction
          const tempDir = path.join(SERVERS_DATA_PATH, server.slug, "temp", Date.now().toString());
          const uploadedFile = path.join(tempDir, input.fileName);
          await fs.mkdir(tempDir, { recursive: true });

          // Save uploaded file
          await fs.writeFile(uploadedFile, input.fileData);

          // Extract world
          const extractedPath = path.join(tempDir, "extracted");
          await fs.mkdir(extractedPath, { recursive: true });
          await worldFileManager.extractWorldFile(uploadedFile, extractedPath);

          // Validate world structure
          const isValid = await worldFileManager.validateWorldStructure(extractedPath);
          if (!isValid) {
            throw new Error("Estrutura do mundo inválida");
          }

          // Get active world and backup it
          const activeWorld = await db.getActiveWorldByServerId(input.serverId);
          if (activeWorld) {
            const backupPath = path.join(SERVERS_DATA_PATH, server.slug, "worlds", `${activeWorld.name}_backup_${Date.now()}`);
            await worldFileManager.cloneWorldForBackup(activeWorld.worldPath, backupPath);
            
            // Create backup record
            await db.createWorldBackup(activeWorld.id, `Backup antes de upload - ${new Date().toLocaleString()}`);
          }

          // Replace current world with uploaded one
          const worldPath = path.join(SERVERS_DATA_PATH, server.slug, "worlds", "current");
          await worldFileManager.replaceWorldWithUpload(worldPath, extractedPath);

          // Get world size
          const size = await worldGeneratorApi.getDirectorySize(worldPath);

          // Create/update world record
          let world = await db.getActiveWorldByServerId(input.serverId);
          if (world) {
            await db.updateWorld(world.id, {
              worldPath,
              size,
              isActive: true,
            });
          } else {
            world = await db.createWorld({
              serverId: input.serverId,
              name: "current",
              worldPath,
              size,
              isActive: true,
              isBackup: false,
            });
          }

          // Clean up temp directory
          await worldFileManager.removeWorldPath(tempDir);

          // Log event
          await db.logServerEvent({
            serverId: input.serverId,
            eventType: "config_change",
            message: `Mundo importado: ${input.fileName}`,
          });

          return world;
        } catch (error) {
          console.error("Erro ao fazer upload de mundo:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Erro ao fazer upload: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }),

    // Download world
    download: protectedProcedure
      .input(z.object({ worldId: z.number() }))
      .query(async ({ input, ctx }) => {
        const world = await db.getWorldById(input.worldId);
        if (!world) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Mundo não encontrado' });
        }

        const server = await db.getServerById(world.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        try {
          // Compress world for download
          const tempDir = path.join(SERVERS_DATA_PATH, server.slug, "downloads");
          await fs.mkdir(tempDir, { recursive: true });
          const zipPath = path.join(tempDir, `${world.name}_${Date.now()}.zip`);

          await worldFileManager.compressWorldForDownload(world.worldPath, zipPath);

          // Upload to storage
          const fileData = await fs.readFile(zipPath);
          const { url } = await storagePut(
            `worlds/${server.slug}/${world.name}_${Date.now()}.zip`,
            fileData,
            "application/zip"
          );

          // Clean up temp file
          await worldFileManager.removeWorldPath(zipPath);

          return { downloadUrl: url };
        } catch (error) {
          console.error("Erro ao fazer download de mundo:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Erro ao fazer download: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }),

    // Create backup of world
    backup: protectedProcedure
      .input(z.object({ worldId: z.number(), backupName: z.string() }))
      .mutation(async ({ input, ctx }) => {
        const world = await db.getWorldById(input.worldId);
        if (!world) {
          throw new TRPCError({ code: 'NOT_FOUND', message: 'Mundo não encontrado' });
        }

        const server = await db.getServerById(world.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        try {
          const backupPath = path.join(SERVERS_DATA_PATH, server.slug, "worlds", `${input.backupName}_${Date.now()}`);
          await worldFileManager.cloneWorldForBackup(world.worldPath, backupPath);

          const size = await worldGeneratorApi.getDirectorySize(backupPath);

          const backup = await db.createWorldBackup(world.id, input.backupName);
          await db.updateWorld(backup.id, {
            worldPath: backupPath,
            size,
          });

          // Log event
          await db.logServerEvent({
            serverId: world.serverId,
            eventType: "backup_created",
            message: `Backup do mundo criado: ${input.backupName}`,
          });

          return backup;
        } catch (error) {
          console.error("Erro ao criar backup:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Erro ao criar backup: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
      }),

    // Delete world
    delete: protectedProcedure
      .input(z.object({ worldId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const world = await db.getWorldById(input.worldId);
        if (!world) {
          throw new TRPCError({ code: 'NOT_FOUND' });
        }

        const server = await db.getServerById(world.serverId);
        if (!server || server.userId !== ctx.user.id) {
          throw new TRPCError({ code: 'FORBIDDEN' });
        }

        try {
          // Remove world from filesystem
          if (await worldFileManager.pathExists(world.worldPath)) {
            await worldFileManager.removeWorldPath(world.worldPath);
          }

          // Remove from database
          await db.deleteWorld(input.worldId);

          // Log event
          await db.logServerEvent({
            serverId: world.serverId,
            eventType: "config_change",
            message: `Mundo deletado: ${world.name}`,
          });

          return { success: true };
        } catch (error) {
          console.error("Erro ao deletar mundo:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: `Erro ao deletar: ${error instanceof Error ? error.message : String(error)}`,
          });
        }
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
