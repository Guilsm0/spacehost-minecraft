import { promises as fs } from "fs";
import * as path from "path";
import { randomBytes } from "crypto";

/**
 * Auto World Creation Module
 * Cria mundos automaticamente ao criar servidor (sem upload)
 */

export interface AutoWorldConfig {
  serverPath: string;
  worldName: string;
  seed?: string;
  difficulty: "peaceful" | "easy" | "normal" | "hard";
  pvp: boolean;
  spawnProtection: number;
  commandBlocks: boolean;
  netherEnabled: boolean;
  animalsEnabled: boolean;
  monstersEnabled: boolean;
  gamemode: "survival" | "creative" | "adventure" | "spectator";
  forceGamemode: boolean;
}

/**
 * Cria um mundo automaticamente ao criar servidor
 */
export async function autoCreateWorld(config: AutoWorldConfig): Promise<void> {
  try {
    const worldPath = path.join(config.serverPath, "worlds", config.worldName);

    // Criar estrutura de diretórios
    await createWorldStructure(worldPath);

    // Criar arquivos essenciais
    await createLevelDat(worldPath, config);
    await createSessionLock(worldPath);
    await createUidDat(worldPath);
    await createEmptyRegions(worldPath);
    await createPlayerData(worldPath);
    await createDataPacks(worldPath);

    console.log(`✓ Mundo "${config.worldName}" criado automaticamente em ${worldPath}`);
  } catch (error) {
    throw new Error(`Erro ao criar mundo automaticamente: ${error}`);
  }
}

/**
 * Cria a estrutura de diretórios do mundo
 */
async function createWorldStructure(worldPath: string): Promise<void> {
  const directories = [
    "region",
    "playerdata",
    "stats",
    "advancements",
    "data",
    "data/raids",
    "data/wandering_trader",
    "data/scoreboard",
    "poi",
    "entities",
  ];

  for (const dir of directories) {
    await fs.mkdir(path.join(worldPath, dir), { recursive: true });
  }
}

/**
 * Cria o arquivo level.dat com configurações do mundo
 */
async function createLevelDat(worldPath: string, config: AutoWorldConfig): Promise<void> {
  const levelData = {
    Data: {
      DataVersion: 3465,
      LevelName: config.worldName,
      Seed: config.seed ? BigInt(config.seed).toString() : generateSeed(),
      GameType: getGamemodeValue(config.gamemode),
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
      ForceGamemode: config.forceGamemode,
      AnimalSpawning: config.animalsEnabled,
      MonsterSpawning: config.monstersEnabled,
      Version: {
        Name: "1.20.1",
        Id: 3465,
      },
      WorldGenSettings: {
        seed: config.seed ? BigInt(config.seed).toString() : generateSeed(),
        generate_features: true,
        bonus_chest: false,
      },
    },
  };

  const levelDatPath = path.join(worldPath, "level.dat");
  await fs.writeFile(levelDatPath, JSON.stringify(levelData, null, 2));
}

/**
 * Cria o arquivo session.lock
 */
async function createSessionLock(worldPath: string): Promise<void> {
  const sessionLock = Buffer.alloc(8);
  sessionLock.writeBigInt64BE(BigInt(Date.now()), 0);
  await fs.writeFile(path.join(worldPath, "session.lock"), sessionLock);
}

/**
 * Cria o arquivo uid.dat com UUID único
 */
async function createUidDat(worldPath: string): Promise<void> {
  const uidDat = randomBytes(16);
  await fs.writeFile(path.join(worldPath, "uid.dat"), uidDat);
}

/**
 * Cria regiões vazias
 */
async function createEmptyRegions(worldPath: string): Promise<void> {
  // Criar arquivo region vazio
  const regionPath = path.join(worldPath, "region");
  const emptyRegion = Buffer.alloc(0);
  await fs.writeFile(path.join(regionPath, "r.0.0.mca"), emptyRegion);
}

/**
 * Cria pasta playerdata
 */
async function createPlayerData(worldPath: string): Promise<void> {
  const playerdataPath = path.join(worldPath, "playerdata");
  // Criar arquivo vazio para compatibilidade
  await fs.writeFile(path.join(playerdataPath, ".gitkeep"), "");
}

/**
 * Cria datapacks padrão
 */
async function createDataPacks(worldPath: string): Promise<void> {
  const dataPath = path.join(worldPath, "datapacks");
  await fs.mkdir(dataPath, { recursive: true });

  // Criar pack.mcmeta
  const packMeta = {
    pack: {
      pack_format: 26,
      description: "Default data pack",
    },
  };

  await fs.writeFile(
    path.join(dataPath, "pack.mcmeta"),
    JSON.stringify(packMeta, null, 2)
  );
}

/**
 * Gera um seed aleatório
 */
function generateSeed(): string {
  return Math.floor(Math.random() * 9223372036854775807).toString();
}

/**
 * Obtém o valor numérico do gamemode
 */
function getGamemodeValue(gamemode: string): number {
  const map: Record<string, number> = {
    survival: 0,
    creative: 1,
    adventure: 2,
    spectator: 3,
  };
  return map[gamemode] || 0;
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
 * Verifica se um mundo foi criado com sucesso
 */
export async function verifyWorldCreation(worldPath: string): Promise<boolean> {
  try {
    const requiredFiles = ["level.dat", "session.lock", "uid.dat"];
    const requiredDirs = ["region", "playerdata"];

    for (const file of requiredFiles) {
      const filePath = path.join(worldPath, file);
      await fs.access(filePath);
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
