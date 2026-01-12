import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import * as path from "path";

/**
 * Minecraft World Manager
 * Gerencia criação, upload e download de mundos
 */

export interface WorldConfig {
  name: string;
  seed?: string;
  worldType: "default" | "flat" | "large_biomes" | "amplified";
  difficulty: "peaceful" | "easy" | "normal" | "hard";
  pvp: boolean;
  spawnProtection: number;
  commandBlocks: boolean;
  netherEnabled: boolean;
}

export interface WorldInfo {
  name: string;
  path: string;
  size: number;
  created: Date;
  lastModified: Date;
  difficulty: string;
  worldType: string;
}

/**
 * Gera um seed aleatório para o mundo
 */
export function generateWorldSeed(): string {
  return randomBytes(8).readBigInt64BE().toString();
}

/**
 * Cria um novo mundo Minecraft
 */
export async function createMinecraftWorld(
  serverPath: string,
  config: WorldConfig
): Promise<WorldInfo> {
  const worldPath = path.join(serverPath, "worlds", config.name);

  try {
    // Criar estrutura de diretórios
    await fs.mkdir(path.join(worldPath, "region"), { recursive: true });
    await fs.mkdir(path.join(worldPath, "playerdata"), { recursive: true });
    await fs.mkdir(path.join(worldPath, "stats"), { recursive: true });
    await fs.mkdir(path.join(worldPath, "advancements"), { recursive: true });
    await fs.mkdir(path.join(worldPath, "data"), { recursive: true });

    // Criar level.dat (arquivo de configuração do mundo)
    const levelDat = createLevelDat(config);
    await fs.writeFile(path.join(worldPath, "level.dat"), levelDat);

    // Criar session.lock
    const sessionLock = Buffer.alloc(8);
    sessionLock.writeBigInt64BE(BigInt(Date.now()), 0);
    await fs.writeFile(path.join(worldPath, "session.lock"), sessionLock);

    // Criar uid.dat
    const uidDat = Buffer.alloc(16);
    randomBytes(16).copy(uidDat);
    await fs.writeFile(path.join(worldPath, "uid.dat"), uidDat);

    // Criar icon.png (opcional)
    const iconPath = path.join(worldPath, "icon.png");
    if (!(await fileExists(iconPath))) {
      // Criar um PNG vazio como placeholder
      const emptyPng = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52, 0x00, 0x00, 0x00, 0x40, 0x00, 0x00, 0x00, 0x40, 0x08, 0x02, 0x00, 0x00, 0x00, 0xaa,
        0x69, 0x71, 0xde, 0x00, 0x00, 0x00, 0x19, 0x74, 0x45, 0x58, 0x74, 0x53, 0x6f, 0x66, 0x74,
        0x77, 0x61, 0x72, 0x65, 0x00, 0x41, 0x64, 0x6f, 0x62, 0x65, 0x20, 0x49, 0x6d, 0x61, 0x67,
        0x65, 0x52, 0x65, 0x61, 0x64, 0x79, 0x71, 0xc9, 0x65, 0x3c, 0x00, 0x00, 0x00, 0x1f, 0x49,
        0x44, 0x41, 0x54, 0x78, 0xda, 0x62, 0xf8, 0xcf, 0xc0, 0x00, 0x00, 0x03, 0x01, 0x01, 0x00,
        0x18, 0xdd, 0x8d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60,
        0x82,
      ]);
      await fs.writeFile(iconPath, emptyPng);
    }

    // Obter informações do mundo
    const stats = await fs.stat(worldPath);

    return {
      name: config.name,
      path: worldPath,
      size: 0,
      created: stats.birthtime,
      lastModified: stats.mtime,
      difficulty: config.difficulty,
      worldType: config.worldType,
    };
  } catch (error) {
    throw new Error(`Erro ao criar mundo: ${error}`);
  }
}

/**
 * Cria um arquivo level.dat (NBT format simplificado)
 */
function createLevelDat(config: WorldConfig): Buffer {
  // Nota: Este é um formato NBT simplificado
  // Para um nível completo, seria necessário usar uma biblioteca NBT
  const data = {
    Data: {
      DataVersion: 3465,
      LevelName: config.name,
      Seed: config.seed || generateWorldSeed(),
      GameType: 0, // Survival
      Difficulty: getDifficultyValue(config.difficulty),
      DifficultyLocked: false,
      Time: 0,
      DayTime: 0,
      SpawnX: 0,
      SpawnY: 64,
      SpawnZ: 0,
      BorderCenterX: 0.0,
      BorderCenterZ: 0.0,
      BorderSize: 59999968.0,
      BorderSafeZone: 29999984.0,
      BorderWarningBlocks: 5,
      BorderWarningTime: 15,
      PvP: config.pvp,
      AllowCommands: config.commandBlocks,
      NetherEnabled: config.netherEnabled,
      SpawnProtection: config.spawnProtection,
    },
  };

  // Serializar para JSON (simplificado)
  return Buffer.from(JSON.stringify(data), "utf-8");
}

/**
 * Obtém o valor numérico da dificuldade
 */
function getDifficultyValue(difficulty: string): number {
  const map: Record<string, number> = {
    peaceful: 0,
    easy: 1,
    normal: 2,
    hard: 3,
  };
  return map[difficulty] || 2;
}

/**
 * Lista todos os mundos de um servidor
 */
export async function listWorlds(serverPath: string): Promise<WorldInfo[]> {
  const worldsPath = path.join(serverPath, "worlds");

  try {
    if (!(await fileExists(worldsPath))) {
      return [];
    }

    const entries = await fs.readdir(worldsPath, { withFileTypes: true });
    const worlds: WorldInfo[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const worldPath = path.join(worldsPath, entry.name);
        const levelDatPath = path.join(worldPath, "level.dat");

        if (await fileExists(levelDatPath)) {
          const stats = await fs.stat(worldPath);
          const size = await getDirectorySize(worldPath);

          worlds.push({
            name: entry.name,
            path: worldPath,
            size,
            created: stats.birthtime,
            lastModified: stats.mtime,
            difficulty: "unknown",
            worldType: "default",
          });
        }
      }
    }

    return worlds;
  } catch (error) {
    throw new Error(`Erro ao listar mundos: ${error}`);
  }
}

/**
 * Obtém o tamanho total de um diretório
 */
export async function getDirectorySize(dirPath: string): Promise<number> {
  let size = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        size += await getDirectorySize(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        size += stats.size;
      }
    }

    return size;
  } catch (error) {
    console.error(`Erro ao calcular tamanho: ${error}`);
    return 0;
  }
}

/**
 * Deleta um mundo
 */
export async function deleteWorld(worldPath: string): Promise<void> {
  try {
    if (await fileExists(worldPath)) {
      await fs.rm(worldPath, { recursive: true, force: true });
    }
  } catch (error) {
    throw new Error(`Erro ao deletar mundo: ${error}`);
  }
}

/**
 * Verifica se um arquivo/diretório existe
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Valida a estrutura de um mundo
 */
export async function validateWorldStructure(worldPath: string): Promise<boolean> {
  try {
    const requiredFiles = ["level.dat", "session.lock"];
    const requiredDirs = ["region", "playerdata"];

    for (const file of requiredFiles) {
      if (!(await fileExists(path.join(worldPath, file)))) {
        return false;
      }
    }

    for (const dir of requiredDirs) {
      const dirPath = path.join(worldPath, dir);
      const stats = await fs.stat(dirPath);
      if (!stats.isDirectory()) {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}
